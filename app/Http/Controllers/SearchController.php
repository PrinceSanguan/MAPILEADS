<?php

namespace App\Http\Controllers;

use App\Models\Search;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    /**
     * List past searches, most recent first.
     */
    public function index(): Response
    {
        return Inertia::render('leads/history', [
            'searches' => Search::withCount('leads')
                ->latest()
                ->get()
                ->map
                ->toSummaryArray()
                ->values(),
        ]);
    }

    /**
     * Show a saved search and its captured businesses.
     */
    public function show(Search $search): Response
    {
        $search->load('leads');

        return Inertia::render('leads/index', [
            'search' => $search->toSummaryArray(),
            'leads' => $search->leads->map->toFrontendArray()->values(),
            'error' => null,
        ]);
    }

    /**
     * Delete a saved search and (via cascade) its businesses.
     */
    public function destroy(Search $search): RedirectResponse
    {
        $search->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Search deleted.']);

        return redirect()->route('searches.index');
    }
}
