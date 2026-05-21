<?php

namespace App\Http\Controllers;

use App\Http\Requests\LeadSearchRequest;
use App\Services\ClaudeService;
use App\Services\GooglePlacesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    /**
     * Render the ChorosLeads-style results page with live businesses from Google Places.
     */
    public function index(LeadSearchRequest $request, GooglePlacesService $places): Response
    {
        $filters = $request->filters();

        $leads = [];
        $error = null;

        if (! empty($filters['types'])) {
            try {
                $leads = $places->search($filters);
            } catch (\Throwable $e) {
                Log::error('Google Places search failed', ['message' => $e->getMessage()]);
                $error = 'We could not load businesses right now. Please check the Places API key and try again.';
            }
        }

        return Inertia::render('leads/index', [
            'filters' => $filters,
            'leads' => $leads,
            'error' => $error,
            // `googleMaps` is shared globally by HandleInertiaRequests — do not re-pass it.
        ]);
    }

    /**
     * On-demand AI analysis + cold email for a single business (JSON, cached by place id).
     */
    public function analyze(Request $request, string $placeId, ClaudeService $claude): JsonResponse
    {
        $lead = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'address' => ['nullable', 'string', 'max:300'],
            'website' => ['nullable', 'string', 'max:300'],
            'phone' => ['nullable', 'string', 'max:60'],
            'rating' => ['nullable', 'numeric'],
            'reviewCount' => ['nullable', 'integer'],
            'types' => ['nullable', 'array'],
            'types.*' => ['string', 'max:80'],
            'reviews' => ['nullable', 'array'],
            'reviews.*.text' => ['nullable', 'string'],
            'reviews.*.rating' => ['nullable', 'numeric'],
            'tone' => ['nullable', 'string', 'max:40'],
        ]);

        $tone = $lead['tone'] ?? 'professional';
        $cacheKey = 'lead_ai:'.$placeId.':'.md5($tone);

        try {
            $result = cache()->remember(
                $cacheKey,
                now()->addDay(),
                fn () => $claude->analyzeBusiness($lead, $tone),
            );
        } catch (\Throwable $e) {
            Log::error('Claude analysis failed', ['message' => $e->getMessage()]);

            return response()->json([
                'message' => 'AI analysis is unavailable right now. Please confirm the Anthropic API key is set and try again.',
            ], 502);
        }

        return response()->json($result);
    }
}
