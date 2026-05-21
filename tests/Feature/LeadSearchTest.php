<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LeadSearchTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // These are backend feature tests; the `leads/index` React page may not
        // be built on disk yet. We still assert the component name + props, but
        // skip Inertia's on-disk file-existence check so the backend can be
        // verified independently of the frontend build.
        config()->set('inertia.testing.ensure_pages_exist', false);
    }

    /**
     * Build a raw Google Places (New) place with a unique id.
     *
     * @return array<string, mixed>
     */
    private function rawPlace(string $id = 'ChIJ_test_1', string $name = "Joe's Diner"): array
    {
        return [
            'id' => $id,
            'displayName' => ['text' => $name],
            'formattedAddress' => '123 Main St, Springfield',
            'location' => ['latitude' => 39.78, 'longitude' => -89.65],
            'rating' => 4.3,
            'userRatingCount' => 128,
            'priceLevel' => 'PRICE_LEVEL_MODERATE',
            'nationalPhoneNumber' => '(217) 555-0100',
            'websiteUri' => 'https://joes.example',
            'googleMapsUri' => 'https://maps.google/?cid=1',
            'types' => ['restaurant', 'food'],
            'primaryTypeDisplayName' => ['text' => 'Restaurant'],
            'businessStatus' => 'OPERATIONAL',
            'currentOpeningHours' => ['openNow' => true],
        ];
    }

    public function test_leads_page_renders_with_results(): void
    {
        config()->set('services.google.places_api_key', 'test-key');

        Http::fake([
            'places.googleapis.com/*' => Http::response([
                'places' => [
                    $this->rawPlace('ChIJ_test_1', "Joe's Diner"),
                    $this->rawPlace('ChIJ_test_2', "Maria's Cafe"),
                ],
            ], 200),
        ]);

        $response = $this->get(route('leads.index', [
            'types' => ['Restaurants'],
            'city' => 'Springfield',
            'volume' => 10,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('leads/index')
            ->has('leads', 2)
        );
    }

    public function test_leads_page_empty_when_no_types(): void
    {
        config()->set('services.google.places_api_key', 'test-key');
        // Disable Inertia SSR so the only HTTP traffic that could occur is the
        // Places API call we are asserting does NOT happen.
        config()->set('inertia.ssr.enabled', false);

        Http::fake();

        $response = $this->get(route('leads.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('leads/index')
            ->has('leads', 0)
        );

        Http::assertNothingSent();
    }

    public function test_volume_above_max_is_rejected(): void
    {
        config()->set('services.google.places_api_key', 'test-key');

        Http::fake();

        $response = $this->get(route('leads.index', [
            'types' => ['Cafes'],
            'volume' => 99999,
        ]));

        $response->assertStatus(302);
        $response->assertSessionHasErrors('volume');
    }

    public function test_places_request_sends_key_and_field_mask_headers(): void
    {
        config()->set('services.google.places_api_key', 'test-key');

        Http::fake([
            'places.googleapis.com/*' => Http::response([
                'places' => [$this->rawPlace()],
            ], 200),
        ]);

        $this->get(route('leads.index', [
            'types' => ['Restaurants'],
            'city' => 'Springfield',
            'volume' => 10,
        ]));

        Http::assertSent(fn ($request) => $request->hasHeader('X-Goog-Api-Key')
            && $request->hasHeader('X-Goog-FieldMask')
            && str_contains($request->url(), 'places:searchText')
        );
    }

    public function test_places_pagination_aggregates_pages(): void
    {
        config()->set('services.google.places_api_key', 'test-key');

        $firstPage = [];
        $secondPage = [];
        for ($i = 0; $i < 10; $i++) {
            $firstPage[] = $this->rawPlace('ChIJ_page1_'.$i, 'Business 1-'.$i);
            $secondPage[] = $this->rawPlace('ChIJ_page2_'.$i, 'Business 2-'.$i);
        }

        Http::fake([
            'places.googleapis.com/*' => Http::sequence()
                ->push(['places' => $firstPage, 'nextPageToken' => 'tok'], 200)
                ->push(['places' => $secondPage], 200),
        ]);

        $response = $this->get(route('leads.index', [
            'types' => ['Restaurants'],
            'city' => 'Springfield',
            'volume' => 30,
        ]));

        $response->assertOk();
        // Volume 30 requested, two pages of 10 = 20 leads available (capped by volume).
        $response->assertInertia(fn (Assert $page) => $page
            ->component('leads/index')
            ->has('leads', 20)
        );

        Http::assertSent(fn ($r) => isset($r->data()['pageToken'])
            || str_contains((string) $r->body(), 'pageToken')
        );
    }
}
