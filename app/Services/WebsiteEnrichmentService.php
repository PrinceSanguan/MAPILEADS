<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Best-effort enrichment of a business from its public website.
 *
 * Fetches the homepage HTML over HTTP and uses regex/string parsing (no DOM
 * library) to pull out social-media profile links, contact email addresses,
 * and phone numbers. Every step is defensive: a blank/invalid URL, a network
 * error, a slow host, or a non-2xx response all resolve to the same empty
 * structure rather than throwing. This is intended to run inside a queued job.
 */
class WebsiteEnrichmentService
{
    /** Max number of items kept per list (deduped, in discovery order). */
    private const MAX_SOCIALS = 8;

    private const MAX_EMAILS = 5;

    private const MAX_PHONES = 5;

    /**
     * Social platforms keyed by a readable label, each with the host fragments
     * that identify a profile link. Order here is the display priority.
     *
     * @var array<string, array<int, string>>
     */
    private const SOCIAL_DOMAINS = [
        'Facebook' => ['facebook.com'],
        'Instagram' => ['instagram.com'],
        'LinkedIn' => ['linkedin.com'],
        'Twitter/X' => ['twitter.com', 'x.com'],
        'TikTok' => ['tiktok.com'],
        'YouTube' => ['youtube.com', 'youtu.be'],
        'WhatsApp' => ['wa.me', 'api.whatsapp.com', 'whatsapp.com'],
    ];

    /**
     * Enrich a website URL into structured contact/social data.
     *
     * @return array{socials: array<int, array{label: string, url: string}>, emails: array<int, string>, phones: array<int, string>}
     */
    public function enrich(string $url): array
    {
        $empty = ['socials' => [], 'emails' => [], 'phones' => []];

        $url = $this->normalizeUrl($url);

        if ($url === null) {
            return $empty;
        }

        $html = $this->fetch($url);

        if ($html === null) {
            return $empty;
        }

        return [
            'socials' => $this->extractSocials($html),
            'emails' => $this->extractEmails($html),
            'phones' => $this->extractPhones($html),
        ];
    }

    /**
     * Ensure a usable absolute http(s) URL, or null if it cannot be one.
     *
     * Adds a default https:// scheme when none is present and rejects values
     * that have no resolvable host (e.g. blank strings, "mailto:", "tel:").
     */
    private function normalizeUrl(string $url): ?string
    {
        $url = trim($url);

        if ($url === '') {
            return null;
        }

        // Protocol-relative ("//example.com") and scheme-less ("example.com").
        if (str_starts_with($url, '//')) {
            $url = 'https:'.$url;
        } elseif (! preg_match('#^https?://#i', $url)) {
            // Reject other explicit schemes we cannot fetch (mailto:, tel:, ftp:, javascript:).
            if (preg_match('#^[a-z][a-z0-9+.-]*:#i', $url)) {
                return null;
            }

            $url = 'https://'.$url;
        }

        $host = parse_url($url, PHP_URL_HOST);

        // Require a host that at least looks like a domain (contains a dot).
        if (! is_string($host) || ! str_contains($host, '.')) {
            return null;
        }

        return $url;
    }

    /**
     * Fetch the page body, returning null on any failure (best-effort, never throws).
     */
    private function fetch(string $url): ?string
    {
        try {
            $response = Http::timeout(8)
                ->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; ChorosLeadsBot/1.0)'])
                ->get($url);

            if (! $response->successful()) {
                return null;
            }

            $body = $response->body();

            return $body !== '' ? $body : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Pull social profile URLs out of the HTML, labelled and deduped.
     *
     * @return array<int, array{label: string, url: string}>
     */
    private function extractSocials(string $html): array
    {
        // Collect every href value plus any bare URLs in the markup so we catch
        // links that aren't wrapped in an anchor (e.g. JSON-LD, data attributes).
        $candidates = array_merge(
            $this->matchAll('#href\s*=\s*["\']([^"\']+)["\']#i', $html),
            // Bare absolute or protocol-relative URLs pointing at a known host.
            $this->matchAll('#(?:https?:)?//[^\s"\'<>()]+#i', $html),
        );

        $socials = [];
        $seen = [];

        foreach ($candidates as $raw) {
            $candidate = $this->absolutize(html_entity_decode($raw, ENT_QUOTES | ENT_HTML5));

            if ($candidate === null) {
                continue;
            }

            $host = strtolower((string) parse_url($candidate, PHP_URL_HOST));

            if ($host === '') {
                continue;
            }

            // Strip a leading "www." so "www.facebook.com" matches "facebook.com".
            $bareHost = preg_replace('#^www\.#', '', $host);

            foreach (self::SOCIAL_DOMAINS as $label => $domains) {
                $matched = false;

                foreach ($domains as $domain) {
                    // Match the domain itself or any subdomain of it.
                    if ($bareHost === $domain || str_ends_with($bareHost, '.'.$domain)) {
                        $matched = true;
                        break;
                    }
                }

                if (! $matched) {
                    continue;
                }

                if ($this->isNonProfileLink($candidate)) {
                    break;
                }

                $clean = $this->cleanUrl($candidate);

                // Dedupe case-insensitively on the cleaned URL.
                $key = strtolower($clean);

                if (isset($seen[$key])) {
                    break;
                }

                $seen[$key] = true;
                $socials[] = ['label' => $label, 'url' => $clean];
                break;
            }

            if (count($socials) >= self::MAX_SOCIALS) {
                break;
            }
        }

        return $socials;
    }

    /**
     * Extract email addresses from mailto: links and free text, filtered/deduped.
     *
     * @return array<int, string>
     */
    private function extractEmails(string $html): array
    {
        $emails = [];
        $seen = [];

        // 1. mailto: hrefs — the most reliable source. Trim any ?subject=... tail.
        foreach ($this->matchAll('#mailto:([^"\'?\s>]+)#i', $html) as $address) {
            $this->collectEmail(rawurldecode($address), $emails, $seen);
        }

        // 2. General address regex over the whole document. Deliberately
        //    conservative: local part of common chars, a dotted domain, and a
        //    2+ letter TLD. Catches "info@example.com" in visible text.
        $pattern = '#[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}#i';

        foreach ($this->matchAll($pattern, $html) as $address) {
            $this->collectEmail($address, $emails, $seen);
        }

        return array_slice($emails, 0, self::MAX_EMAILS);
    }

    /**
     * Validate, normalize and append an email candidate (deduped) if it passes filters.
     *
     * @param  array<int, string>  $emails
     * @param  array<string, bool>  $seen
     */
    private function collectEmail(string $candidate, array &$emails, array &$seen): void
    {
        $email = strtolower(trim($candidate, " \t\n\r\0\x0B.,;:"));

        if ($email === '' || ! str_contains($email, '@')) {
            return;
        }

        // Drop URL-encoded fragments and other obvious junk.
        if (str_contains($email, '%')) {
            return;
        }

        // Drop addresses that are really image/asset filenames (e.g. "logo@2x.png").
        if (preg_match('#\.(png|jpe?g|webp|gif|svg|ico|bmp|css|js)$#i', $email)) {
            return;
        }

        // Drop known tooling/noise senders that appear in bundled JS.
        if (preg_match('#@(sentry\.|.*\.sentry\.|sentry-next\.wixpress\.com|wixpress\.com|example\.(com|org|net))#i', $email)) {
            return;
        }

        // Sanity check the overall shape once more.
        if (! preg_match('#^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$#i', $email)) {
            return;
        }

        if (isset($seen[$email])) {
            return;
        }

        $seen[$email] = true;
        $emails[] = $email;
    }

    /**
     * Extract phone numbers, primarily from tel: links, deduped.
     *
     * @return array<int, string>
     */
    private function extractPhones(string $html): array
    {
        $phones = [];
        $seen = [];

        // 1. tel: hrefs — the authoritative, machine-readable source.
        foreach ($this->matchAll('#tel:([^"\'?\s>]+)#i', $html) as $raw) {
            $this->collectPhone(rawurldecode($raw), $phones, $seen);
        }

        // 2. Conservative free-text fallback: an optional leading + and 7–15
        //    digits with common separators (spaces, dots, dashes, parens).
        //    Bounded so we don't grab long digit runs out of scripts/IDs.
        $pattern = '#(?<![\w/.])\+?\d[\d\s().\-]{6,16}\d(?![\w/.])#';

        foreach ($this->matchAll($pattern, $html) as $raw) {
            $this->collectPhone($raw, $phones, $seen);
        }

        return array_slice($phones, 0, self::MAX_PHONES);
    }

    /**
     * Normalize, validate and append a phone candidate (deduped) if plausible.
     *
     * @param  array<int, string>  $phones
     * @param  array<string, bool>  $seen
     */
    private function collectPhone(string $candidate, array &$phones, array &$seen): void
    {
        $display = trim($candidate);

        if ($display === '') {
            return;
        }

        // Keep only digits (plus a single leading +) for validation + dedupe.
        $hasPlus = str_starts_with($display, '+');
        $digits = preg_replace('#\D+#', '', $display);

        if ($digits === null) {
            return;
        }

        // Real-world phone numbers have roughly 7–15 digits (ITU E.164 max).
        $len = strlen($digits);

        if ($len < 7 || $len > 15) {
            return;
        }

        // Tidy the display value: collapse runs of whitespace.
        $display = trim((string) preg_replace('#\s+#', ' ', $display));

        $key = ($hasPlus ? '+' : '').$digits;

        if (isset($seen[$key])) {
            return;
        }

        $seen[$key] = true;
        $phones[] = $display;
    }

    /**
     * Turn a candidate href into an absolute http(s) URL, or null if it isn't one.
     *
     * Only protocol-relative ("//host/...") and absolute URLs are kept; relative
     * paths and non-http schemes (mailto, tel, #anchors) are intentionally dropped
     * since social links on a page are practically always absolute.
     */
    private function absolutize(string $url): ?string
    {
        $url = trim($url);

        if ($url === '') {
            return null;
        }

        if (str_starts_with($url, '//')) {
            $url = 'https:'.$url;
        }

        if (! preg_match('#^https?://#i', $url)) {
            return null;
        }

        return $url;
    }

    /**
     * True for share/intent/sharer style links we don't want to capture as profiles.
     */
    private function isNonProfileLink(string $url): bool
    {
        $path = strtolower((string) parse_url($url, PHP_URL_PATH));

        // facebook.com/sharer, twitter.com/intent, youtube share dialogs, etc.
        return (bool) preg_match('#/(sharer|share|intent|dialog)\b#', $path)
            || str_contains($path, '/plugins/');
    }

    /**
     * Light-touch tracking cleanup: drop the fragment and common UTM/click-id
     * query params, while preserving the meaningful parts of the URL.
     */
    private function cleanUrl(string $url): string
    {
        // Remove the #fragment.
        $url = (string) preg_replace('#\#.*$#', '', $url);

        $parts = explode('?', $url, 2);

        if (count($parts) === 2 && $parts[1] !== '') {
            parse_str($parts[1], $query);

            $query = array_filter(
                $query,
                fn ($key) => ! preg_match('#^(utm_|fbclid$|gclid$|mc_|ref$|igshid$)#i', (string) $key),
                ARRAY_FILTER_USE_KEY,
            );

            $url = $query !== [] ? $parts[0].'?'.http_build_query($query) : $parts[0];
        }

        // Trim a trailing slash on bare-domain/profile roots for nicer dedupe.
        return rtrim($url, '/') === rtrim($parts[0], '/') && ! str_contains($url, '?')
            ? rtrim($url, '/')
            : $url;
    }

    /**
     * Run a regex over the subject and return capture group 1 (or full match).
     *
     * @return array<int, string>
     */
    private function matchAll(string $pattern, string $subject): array
    {
        if (preg_match_all($pattern, $subject, $matches) === false) {
            return [];
        }

        // Prefer the first capture group when the pattern defines one.
        return $matches[1] ?? $matches[0];
    }
}
