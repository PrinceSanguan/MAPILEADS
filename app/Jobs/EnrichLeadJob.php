<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Services\WebsiteEnrichmentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Enriches a single Lead from its public website in the background.
 *
 * Best-effort by design: the work is purely additive (social links, emails,
 * extra phones) so a failure must never poison the lead. We keep a single
 * attempt and swallow errors with a warning rather than retrying.
 */
class EnrichLeadJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Network enrichment is best-effort; do not retry on failure. */
    public int $tries = 1;

    /** Hard ceiling above the service's own 8s HTTP timeout. */
    public int $timeout = 30;

    public function __construct(public int $leadId) {}

    public function handle(WebsiteEnrichmentService $service): void
    {
        $lead = Lead::find($this->leadId);

        if (! $lead || ! $lead->website) {
            return;
        }

        try {
            $data = $service->enrich($lead->website);

            $lead->update([
                'socials' => $data['socials'],
                'emails' => $data['emails'],
                'extra_phones' => $data['phones'],
                'enriched_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Lead enrichment failed', [
                'lead' => $this->leadId,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
