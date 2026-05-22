<?php

namespace App\Http\Controllers;

use App\Http\Requests\LeadSearchRequest;
use App\Jobs\EnrichLeadJob;
use App\Models\Lead;
use App\Models\Search;
use App\Services\ClaudeService;
use App\Services\GooglePlacesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    /**
     * Run a search against Google Places, persist it, then redirect to the saved search.
     */
    public function index(LeadSearchRequest $request, GooglePlacesService $places): Response|RedirectResponse
    {
        $filters = $request->filters();

        if (empty($filters['types'])) {
            return Inertia::render('leads/index', [
                'search' => null,
                'leads' => [],
                'error' => null,
            ]);
        }

        try {
            $results = $places->search($filters);

            $search = Search::create([
                'types' => $filters['types'],
                'country' => $filters['country'] ?? null,
                'region' => $filters['region'] ?? null,
                'province' => $filters['province'] ?? null,
                'city' => $filters['city'] ?? null,
                'location_label' => $this->locationLabel($filters),
                'volume' => (int) ($filters['volume'] ?? 10),
                'results_count' => count($results),
            ]);

            foreach ($results as $result) {
                $lead = $search->leads()->create([
                    'place_id' => $result['placeId'] ?? '',
                    'name' => $result['name'] ?? 'Unnamed business',
                    'address' => $result['address'] ?? null,
                    'lat' => (float) ($result['lat'] ?? 0),
                    'lng' => (float) ($result['lng'] ?? 0),
                    'rating' => $result['rating'] ?? null,
                    'review_count' => $result['reviewCount'] ?? null,
                    'price_level' => $result['priceLevel'] ?? null,
                    'phone' => $result['phone'] ?? null,
                    'website' => $result['website'] ?? null,
                    'google_maps_uri' => $result['googleMapsUri'] ?? null,
                    'business_status' => $result['businessStatus'] ?? null,
                    'open_now' => $result['openNow'] ?? null,
                    'types' => $result['types'] ?? [],
                    'reviews' => $result['reviews'] ?? [],
                    'opening_hours' => $result['openingHours'] ?? [],
                    'editorial_summary' => $result['editorialSummary'] ?? null,
                ]);

                EnrichLeadJob::dispatch($lead->id);
            }

            return redirect()->route('searches.show', $search);
        } catch (\Throwable $e) {
            Log::error('Google Places search failed', ['message' => $e->getMessage()]);

            return Inertia::render('leads/index', [
                'search' => null,
                'leads' => [],
                'error' => 'We could not load businesses right now. Please check the Places API key and try again.',
            ]);
        }
    }

    /**
     * On-demand AI analysis + cold email for a single saved business (JSON, persisted by tone).
     */
    public function analyze(Request $request, Lead $lead, ClaudeService $claude): JsonResponse
    {
        $request->validate([
            'tone' => ['nullable', 'string', 'max:40'],
        ]);

        $tone = $request->input('tone', 'professional');

        // Reuse the stored analysis when it was generated for the same tone.
        if ($lead->ai_analysis && $lead->ai_tone === $tone) {
            return response()->json([
                'strengths' => $lead->ai_analysis['strengths'] ?? [],
                'painPoints' => $lead->ai_analysis['painPoints'] ?? [],
                'reviewInsights' => $lead->ai_analysis['reviewInsights'] ?? [],
                'email' => $lead->ai_email ?? ['subject' => '', 'body' => ''],
            ]);
        }

        try {
            $result = $claude->analyzeBusiness($lead->toAiArray(), $tone);
        } catch (\Throwable $e) {
            Log::error('Claude analysis failed', ['message' => $e->getMessage()]);

            return response()->json([
                'message' => 'AI analysis is unavailable right now. Please confirm the Anthropic API key is set and try again.',
            ], 502);
        }

        $lead->update([
            'ai_analysis' => [
                'strengths' => $result['strengths'],
                'painPoints' => $result['painPoints'],
                'reviewInsights' => $result['reviewInsights'],
            ],
            'ai_email' => $result['email'],
            'ai_tone' => $tone,
            'analyzed_at' => now(),
        ]);

        return response()->json($result);
    }

    /**
     * Remove a single business from a saved search.
     */
    public function destroyLead(Lead $lead): RedirectResponse
    {
        $searchId = $lead->search_id;

        $lead->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Business removed.']);

        return redirect()->route('searches.show', $searchId);
    }

    /**
     * Build a human-readable label from the most specific area fields available.
     *
     * @param  array<string, mixed>  $filters
     */
    private function locationLabel(array $filters): string
    {
        $parts = array_filter([
            $filters['city'] ?? null,
            $filters['province'] ?? null,
            $filters['region'] ?? null,
            $filters['country'] ?? null,
        ], fn ($v) => is_string($v) && trim($v) !== '');

        return $parts === [] ? 'your selected area' : implode(', ', $parts);
    }
}
