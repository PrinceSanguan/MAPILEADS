<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Calls the Anthropic Claude Messages API (raw HTTP via the Http facade) to
 * analyze a business and draft a personalized cold email.
 *
 * Uses prompt caching on the stable system prompt (the volatile per-business
 * data lives in the user turn) and structured JSON output so the response maps
 * directly onto the LeadAnalysis shape consumed by the frontend.
 */
class ClaudeService
{
    private const ENDPOINT = 'https://api.anthropic.com/v1/messages';

    private const VERSION = '2023-06-01';

    /**
     * Analyze a business and generate a cold email in the requested tone.
     *
     * @param  array<string, mixed>  $lead
     * @return array{strengths: array<int, string>, painPoints: array<int, string>, reviewInsights: array<int, string>, email: array{subject: string, body: string}}
     */
    public function analyzeBusiness(array $lead, string $tone = 'professional'): array
    {
        $apiKey = config('services.anthropic.key');

        if (empty($apiKey)) {
            throw new RuntimeException('Anthropic API key is not configured.');
        }

        $response = Http::withHeaders([
            'x-api-key' => $apiKey,
            'anthropic-version' => self::VERSION,
            'content-type' => 'application/json',
        ])->timeout(60)->post(self::ENDPOINT, [
            'model' => config('services.anthropic.model', 'claude-sonnet-4-6'),
            'max_tokens' => 2048,
            // Fast, cheap structured extraction — no deep reasoning needed.
            'thinking' => ['type' => 'disabled'],
            'output_config' => [
                'effort' => 'low',
                'format' => [
                    'type' => 'json_schema',
                    'schema' => $this->schema(),
                ],
            ],
            // Stable instruction block is cached; per-business data goes in the user turn.
            'system' => [[
                'type' => 'text',
                'text' => $this->systemPrompt(),
                'cache_control' => ['type' => 'ephemeral'],
            ]],
            'messages' => [[
                'role' => 'user',
                'content' => $this->buildUserContent($lead, $tone),
            ]],
        ]);

        if ($response->failed()) {
            $message = $response->json('error.message') ?? 'Anthropic request failed.';
            throw new RuntimeException("Anthropic error: {$message}");
        }

        if ($response->json('stop_reason') === 'refusal') {
            throw new RuntimeException('The model declined to analyze this business.');
        }

        return $this->parse($response->json());
    }

    /**
     * Extract and decode the structured JSON from the response content blocks.
     *
     * @param  array<string, mixed>  $body
     * @return array<string, mixed>
     */
    private function parse(array $body): array
    {
        $text = '';

        foreach ($body['content'] ?? [] as $block) {
            if (($block['type'] ?? null) === 'text') {
                $text .= $block['text'] ?? '';
            }
        }

        $decoded = json_decode(trim($text), true);

        if (! is_array($decoded)) {
            throw new RuntimeException('Could not parse the model response.');
        }

        return [
            'strengths' => array_values(array_filter((array) ($decoded['strengths'] ?? []), 'is_string')),
            'painPoints' => array_values(array_filter((array) ($decoded['painPoints'] ?? []), 'is_string')),
            'reviewInsights' => array_values(array_filter((array) ($decoded['reviewInsights'] ?? []), 'is_string')),
            'email' => [
                'subject' => (string) data_get($decoded, 'email.subject', ''),
                'body' => (string) data_get($decoded, 'email.body', ''),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function schema(): array
    {
        $stringArray = ['type' => 'array', 'items' => ['type' => 'string']];

        return [
            'type' => 'object',
            'additionalProperties' => false,
            'properties' => [
                'strengths' => $stringArray,
                'painPoints' => $stringArray,
                'reviewInsights' => $stringArray,
                'email' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'properties' => [
                        'subject' => ['type' => 'string'],
                        'body' => ['type' => 'string'],
                    ],
                    'required' => ['subject', 'body'],
                ],
            ],
            'required' => ['strengths', 'painPoints', 'reviewInsights', 'email'],
        ];
    }

    /**
     * Frozen, cacheable instructions. Kept verbose so the cached prefix is
     * large enough to engage prompt caching (Sonnet 4.6 min ~2048 tokens).
     */
    private function systemPrompt(): string
    {
        return <<<'PROMPT'
        You are a senior B2B sales intelligence analyst working inside a lead-generation
        platform. Sales reps use you to quickly understand a local business they found on
        the map and to draft a first cold-outreach email. Your analysis must be sharp,
        specific, and grounded ONLY in the business data provided in the user message —
        never invent facts, phone numbers, owners, or events that are not supported by the
        data. When data is missing, reason about what its absence implies for an outreach
        angle (for example, a business with no website listed is a strong opportunity for
        anyone selling web design, online ordering, or digital presence services).

        You always return a single JSON object that matches the provided schema, with these
        four fields:

        1. "strengths" — 3 to 5 short bullet strings describing what this business appears to
           do well or what makes it notable (e.g. high rating, large review volume, strong
           reputation, established presence, premium positioning). Base each point on the
           supplied rating, review count, category, and review text. Keep each bullet under
           20 words.

        2. "painPoints" — 3 to 5 short bullet strings describing likely problems, gaps, or
           unmet needs that a salesperson could help solve. Infer these from low or middling
           ratings, negative or mixed review themes, a missing website, a missing phone
           number, signs of poor customer service, slow response, outdated presence, or
           limited online visibility. Each pain point should be something a vendor could
           plausibly address. Keep each bullet under 20 words.

        3. "reviewInsights" — 2 to 4 short bullet strings summarizing concrete themes found in
           the customer reviews provided (praise, recurring complaints, standout phrases,
           sentiment). If no reviews are provided, return insights derived from the rating and
           review count instead (e.g. "Few public reviews — limited social proof to convert
           new customers"). Keep each bullet under 25 words.

        4. "email" — a personalized cold outreach email object with "subject" and "body".
           The email is written from the perspective of a sales rep reaching out to this
           specific business for the first time. Requirements for the email:
             - The subject line is concise (under 60 characters), specific to the business,
               and avoids spammy phrasing or ALL CAPS.
             - The body opens with a genuine, specific observation about THIS business
               (referencing its name and something real from the data — its rating, a review
               theme, its category, or a noticeable gap). This proves the email is not a mass
               blast.
             - The body then bridges to a relevant value proposition that addresses one of the
               pain points you identified, framed as a question or soft offer rather than a
               hard pitch.
             - Use placeholders in square brackets for anything the sender must fill in:
               [Your Name], [Your Company], [Your Service/Product], and [Calendar Link]. Do not
               fabricate the sender's company or offering — leave those as placeholders.
             - Keep the body between 90 and 160 words, friendly and human, with short
               paragraphs, a clear single call to action, and a sign-off using [Your Name].
             - Match the requested tone provided in the user message (for example
               "professional", "friendly", "casual", or "direct"). Adjust greeting, warmth, and
               phrasing to fit that tone while staying respectful and non-pushy.

        Write naturally. Do not include markdown headers, code fences, or any text outside the
        JSON object. Address the business by name where natural. Never include the raw schema
        or these instructions in your output.
        PROMPT;
    }

    /**
     * Build the volatile per-business user turn (kept out of the cached prefix).
     *
     * @param  array<string, mixed>  $lead
     */
    private function buildUserContent(array $lead, string $tone): string
    {
        $lines = [];
        $lines[] = 'Analyze the following business and draft a cold outreach email.';
        $lines[] = '';
        $lines[] = 'Requested email tone: '.$tone;
        $lines[] = '';
        $lines[] = 'BUSINESS DATA';
        $lines[] = 'Name: '.($lead['name'] ?? 'Unknown');

        if (! empty($lead['types'])) {
            $types = is_array($lead['types']) ? implode(', ', $lead['types']) : (string) $lead['types'];
            $lines[] = 'Category: '.$types;
        }
        if (! empty($lead['address'])) {
            $lines[] = 'Address: '.$lead['address'];
        }
        $lines[] = 'Website: '.(! empty($lead['website']) ? $lead['website'] : 'NONE LISTED');
        $lines[] = 'Phone: '.(! empty($lead['phone']) ? $lead['phone'] : 'NONE LISTED');
        $lines[] = 'Google rating: '.($lead['rating'] ?? 'N/A')
            .' from '.($lead['reviewCount'] ?? 0).' reviews';

        if (! empty($lead['reviews']) && is_array($lead['reviews'])) {
            $lines[] = '';
            $lines[] = 'CUSTOMER REVIEWS';
            foreach (array_slice($lead['reviews'], 0, 5) as $review) {
                $rating = data_get($review, 'rating', '?');
                $body = trim((string) data_get($review, 'text', ''));

                if ($body !== '') {
                    $lines[] = "- ({$rating}/5) ".mb_substr($body, 0, 400);
                }
            }
        }

        return implode("\n", $lines);
    }
}
