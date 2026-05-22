<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Wraps the Google Places API (New) Text Search endpoint.
 *
 * Requires a server-side key (config services.google.places_api_key) with the
 * Places API (New) enabled and billing on. Returns businesses normalized to the
 * shape consumed by the React results page (see resources/js/types/leads.ts).
 */
class GooglePlacesService
{
    private const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

    private const PAGE_SIZE = 20;

    private const MAX_PAGES = 3;

    /**
     * Search businesses for the given normalized filters.
     *
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function search(array $filters): array
    {
        $apiKey = config('services.google.places_api_key');

        if (empty($apiKey)) {
            throw new RuntimeException('Google Places API key is not configured.');
        }

        $limit = max(1, (int) ($filters['volume'] ?? 10));
        $query = $this->buildTextQuery($filters);

        $leads = [];
        $pageToken = null;
        $pages = 0;

        do {
            $body = ['textQuery' => $query, 'pageSize' => self::PAGE_SIZE];

            if ($pageToken) {
                $body['pageToken'] = $pageToken;
            }

            $response = Http::withHeaders([
                'X-Goog-Api-Key' => $apiKey,
                'X-Goog-FieldMask' => $this->fieldMask(),
                'Content-Type' => 'application/json',
            ])->post(self::ENDPOINT, $body);

            if ($response->failed()) {
                $message = $response->json('error.message') ?? 'Places request failed.';
                throw new RuntimeException("Google Places error: {$message}");
            }

            foreach ($response->json('places', []) as $place) {
                $leads[] = $this->normalize($place);

                if (count($leads) >= $limit) {
                    return $leads;
                }
            }

            $pageToken = $response->json('nextPageToken');
            $pages++;
        } while ($pageToken && $pages < self::MAX_PAGES);

        return $leads;
    }

    /**
     * Compose a Google-Maps-style text query from the form filters.
     *
     * @param  array<string, mixed>  $filters
     */
    public function buildTextQuery(array $filters): string
    {
        $types = $filters['types'] ?? [];
        $typePart = is_array($types) ? implode(', ', $types) : (string) $types;

        // Build the location part from the most specific non-empty field.
        $areaParts = array_filter([
            $this->ignorePlaceholder($filters['city'] ?? null, ['All']),
            $this->ignorePlaceholder($filters['province'] ?? null, ['Entire region']),
            $this->ignorePlaceholder($filters['region'] ?? null, []),
            $filters['country'] ?? null,
        ], fn ($v) => is_string($v) && trim($v) !== '');

        $area = trim((string) reset($areaParts));
        $country = trim((string) ($filters['country'] ?? ''));

        // Anchor to the country for relevance when a more specific area is chosen.
        if ($area !== '' && $country !== '' && $area !== $country) {
            $location = "{$area}, {$country}";
        } else {
            $location = $area !== '' ? $area : $country;
        }

        $query = trim($typePart);

        if ($location !== '') {
            $query .= ($query !== '' ? ' in ' : '').$location;
        }

        return $query !== '' ? $query : 'businesses';
    }

    /**
     * @param  array<int, string>  $placeholders
     */
    private function ignorePlaceholder(?string $value, array $placeholders): ?string
    {
        if ($value === null) {
            return null;
        }

        return in_array($value, $placeholders, true) ? null : $value;
    }

    private function fieldMask(): string
    {
        $fields = [
            'places.id',
            'places.displayName',
            'places.formattedAddress',
            'places.location',
            'places.rating',
            'places.userRatingCount',
            'places.priceLevel',
            'places.nationalPhoneNumber',
            'places.internationalPhoneNumber',
            'places.websiteUri',
            'places.googleMapsUri',
            'places.types',
            'places.primaryTypeDisplayName',
            'places.businessStatus',
            'places.currentOpeningHours.openNow',
            'places.reviews',
            'places.regularOpeningHours',
            'places.editorialSummary',
            'nextPageToken',
        ];

        return implode(',', $fields);
    }

    /**
     * Map a raw Places API place to the normalized Lead shape.
     *
     * @param  array<string, mixed>  $place
     * @return array<string, mixed>
     */
    private function normalize(array $place): array
    {
        $reviews = [];

        if (! empty($place['reviews'])) {
            foreach (array_slice($place['reviews'], 0, 5) as $review) {
                $reviews[] = [
                    'author' => data_get($review, 'authorAttribution.displayName', 'Anonymous'),
                    'rating' => (int) data_get($review, 'rating', 0),
                    'text' => (string) data_get($review, 'text.text', data_get($review, 'originalText.text', '')),
                    'time' => (string) data_get($review, 'publishTime', ''),
                ];
            }
        }

        return [
            'placeId' => data_get($place, 'id'),
            'name' => data_get($place, 'displayName.text', 'Unnamed business'),
            'address' => data_get($place, 'formattedAddress'),
            'lat' => (float) data_get($place, 'location.latitude', 0),
            'lng' => (float) data_get($place, 'location.longitude', 0),
            'rating' => data_get($place, 'rating') !== null ? (float) data_get($place, 'rating') : null,
            'reviewCount' => data_get($place, 'userRatingCount') !== null ? (int) data_get($place, 'userRatingCount') : null,
            'priceLevel' => $this->priceLevel(data_get($place, 'priceLevel')),
            'phone' => data_get($place, 'nationalPhoneNumber', data_get($place, 'internationalPhoneNumber')),
            'website' => data_get($place, 'websiteUri'),
            'googleMapsUri' => data_get($place, 'googleMapsUri'),
            'types' => $this->types($place),
            'businessStatus' => data_get($place, 'businessStatus'),
            'openNow' => data_get($place, 'currentOpeningHours.openNow'),
            'reviews' => $reviews,
            'openingHours' => data_get($place, 'regularOpeningHours.weekdayDescriptions', []),
            'editorialSummary' => data_get($place, 'editorialSummary.text'),
        ];
    }

    /**
     * Places (New) returns price level as an enum string; map to a 0–4 number.
     */
    private function priceLevel(mixed $value): ?int
    {
        if ($value === null) {
            return null;
        }

        return match ($value) {
            'PRICE_LEVEL_FREE' => 0,
            'PRICE_LEVEL_INEXPENSIVE' => 1,
            'PRICE_LEVEL_MODERATE' => 2,
            'PRICE_LEVEL_EXPENSIVE' => 3,
            'PRICE_LEVEL_VERY_EXPENSIVE' => 4,
            default => is_numeric($value) ? (int) $value : null,
        };
    }

    /**
     * @param  array<string, mixed>  $place
     * @return array<int, string>
     */
    private function types(array $place): array
    {
        $primary = data_get($place, 'primaryTypeDisplayName.text');

        if (is_string($primary) && $primary !== '') {
            return [$primary];
        }

        $types = data_get($place, 'types', []);

        return is_array($types) ? array_values(array_slice($types, 0, 3)) : [];
    }
}
