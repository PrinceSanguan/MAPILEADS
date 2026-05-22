<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Search;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LeadSearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // These are backend feature tests; the `leads/index` React page may not
        // be built on disk yet. We still assert the component name + props, but
        // skip Inertia's on-disk file-existence check so the backend can be
        // verified independently of the frontend build.
        config()->set('inertia.testing.ensure_pages_exist', false);
        config()->set('services.google.places_api_key', 'test-key');
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
            'reviews' => [[
                'authorAttribution' => ['displayName' => 'Jane R.'],
                'rating' => 5,
                'text' => ['text' => 'Great food and friendly staff.'],
                'publishTime' => '2024-01-01T00:00:00Z',
            ]],
        ];
    }

    /**
     * The X-Goog-FieldMask value can arrive as a single string or an array of
     * header values depending on the client; read it robustly.
     */
    private function fieldMaskValue(\Illuminate\Http\Client\Request $request): string
    {
        $header = $request->header('X-Goog-FieldMask');

        return is_array($header) ? implode(',', $header) : (string) $header;
    }

    public function test_search_saves_results_and_redirects(): void
    {
        Http::fake([
            'places.googleapis.com/*' => Http::response([
                'places' => [
                    $this->rawPlace('ChIJ_test_1', "Joe's Diner"),
                    $this->rawPlace('ChIJ_test_2', "Maria's Cafe"),
                ],
            ], 200),
            // Catch-all so the sync EnrichLeadJob's website fetch is intercepted.
            '*' => Http::response('<html></html>', 200),
        ]);

        $response = $this->get(route('leads.index', [
            'types' => ['Restaurants'],
            'city' => 'Springfield',
            'volume' => 10,
        ]));

        // Redirect to the saved search's show page.
        $response->assertRedirect();
        $this->assertMatchesRegularExpression('#/searches/\d+$#', $response->headers->get('Location'));

        $this->assertDatabaseHas('searches', [
            'results_count' => 2,
            'city' => 'Springfield',
        ]);
        $this->assertDatabaseCount('leads', 2);
        $this->assertDatabaseHas('leads', ['place_id' => 'ChIJ_test_1', 'name' => "Joe's Diner"]);
    }

    public function test_saved_search_show_renders_leads(): void
    {
        $search = Search::factory()->create();
        Lead::factory()->count(2)->for($search)->create();

        $response = $this->get(route('searches.show', $search));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('leads/index')
            ->has('leads', 2)
            ->has('search')
        );
    }

    public function test_search_with_no_types_renders_empty_and_calls_nothing(): void
    {
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

        $this->assertDatabaseCount('searches', 0);
        $this->assertDatabaseCount('leads', 0);
        Http::assertNothingSent();
    }

    public function test_volume_above_max_is_rejected(): void
    {
        Http::fake();

        $response = $this->get(route('leads.index', [
            'types' => ['Cafes'],
            'volume' => 99999,
        ]));

        $response->assertStatus(302);
        $response->assertSessionHasErrors('volume');

        $this->assertDatabaseCount('searches', 0);
    }

    public function test_places_field_mask_always_requests_reviews(): void
    {
        Http::fake([
            'places.googleapis.com/*' => Http::response([
                'places' => [$this->rawPlace()],
            ], 200),
            '*' => Http::response('<html></html>', 200),
        ]);

        $this->get(route('leads.index', [
            'types' => ['Restaurants'],
            'city' => 'Springfield',
            'volume' => 10,
        ]));

        Http::assertSent(fn ($request) => str_contains($request->url(), 'places:searchText')
            && $request->hasHeader('X-Goog-FieldMask')
            && str_contains($this->fieldMaskValue($request), 'places.reviews')
        );
    }

    public function test_places_pagination_aggregates_and_saves(): void
    {
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
            '*' => Http::response('<html></html>', 200),
        ]);

        $response = $this->get(route('leads.index', [
            'types' => ['Restaurants'],
            'city' => 'Springfield',
            'volume' => 30,
        ]));

        $response->assertRedirect();

        // Volume 30 requested, two pages of 10 = 20 leads aggregated and saved.
        $this->assertDatabaseCount('leads', 20);
        $this->assertDatabaseHas('searches', ['results_count' => 20]);

        // The second page request must carry the pageToken from page one.
        Http::assertSent(fn ($r) => str_contains($r->url(), 'places:searchText')
            && (data_get($r->data(), 'pageToken') === 'tok'
                || str_contains((string) $r->body(), 'pageToken'))
        );
    }
}
