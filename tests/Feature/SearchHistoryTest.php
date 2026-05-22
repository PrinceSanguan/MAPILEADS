<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Search;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SearchHistoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The history/show React pages may not be built on disk during this run.
        config()->set('inertia.testing.ensure_pages_exist', false);
    }

    public function test_history_lists_searches(): void
    {
        Search::factory()->count(2)->create()->each(
            fn (Search $search) => Lead::factory()->count(2)->for($search)->create(),
        );

        $response = $this->get(route('searches.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('leads/history')
            ->has('searches', 2)
        );
    }

    public function test_shown_leads_expose_numeric_rating_and_counts(): void
    {
        // Guards the regression where MySQL returned float/int columns as strings,
        // crashing the React RatingBadge with `rating.toFixed is not a function`.
        $search = Search::factory()->create();
        Lead::factory()->for($search)->create([
            'rating' => 4.5,
            'review_count' => 128,
            'price_level' => 2,
        ]);

        $response = $this->get(route('searches.show', $search));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('leads/index')
            ->where('leads.0.rating', fn ($value) => is_float($value))
            ->where('leads.0.reviewCount', fn ($value) => is_int($value))
            ->where('leads.0.priceLevel', fn ($value) => is_int($value))
        );
    }

    public function test_search_can_be_deleted_with_its_leads(): void
    {
        $search = Search::factory()->create();
        Lead::factory()->count(3)->for($search)->create();

        $response = $this->delete(route('searches.destroy', $search));

        $response->assertRedirect(route('searches.index'));
        $this->assertDatabaseMissing('searches', ['id' => $search->id]);
        // Leads removed via the foreign-key cascade.
        $this->assertDatabaseCount('leads', 0);
    }

    public function test_individual_lead_can_be_deleted(): void
    {
        $search = Search::factory()->create();
        $leadA = Lead::factory()->for($search)->create();
        $leadB = Lead::factory()->for($search)->create();

        $response = $this->delete(route('leads.destroy', $leadA));

        $response->assertRedirect(route('searches.show', $search->id));
        $this->assertDatabaseMissing('leads', ['id' => $leadA->id]);
        // The search and the other lead survive.
        $this->assertDatabaseHas('searches', ['id' => $search->id]);
        $this->assertDatabaseHas('leads', ['id' => $leadB->id]);
    }
}
