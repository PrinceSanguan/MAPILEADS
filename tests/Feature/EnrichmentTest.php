<?php

namespace Tests\Feature;

use App\Jobs\EnrichLeadJob;
use App\Models\Lead;
use App\Services\WebsiteEnrichmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EnrichmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_website_enrichment_extracts_socials_emails_phones(): void
    {
        $html = <<<'HTML'
        <html>
          <body>
            <a href="https://facebook.com/acme">fb</a>
            <a href="https://instagram.com/acme">ig</a>
            <a href="mailto:hi@acme.com">mail</a>
            <a href="tel:+15551234567">call</a>
          </body>
        </html>
        HTML;

        Http::fake(['*' => Http::response($html, 200)]);

        $result = app(WebsiteEnrichmentService::class)->enrich('https://acme.com');

        $labels = array_column($result['socials'], 'label');
        $this->assertContains('Facebook', $labels);
        $this->assertContains('Instagram', $labels);

        $this->assertContains('hi@acme.com', $result['emails']);
        $this->assertNotEmpty($result['phones']);
    }

    public function test_enrich_lead_job_updates_lead(): void
    {
        $lead = Lead::factory()->create(['website' => 'https://acme.com']);

        Http::fake(['*' => Http::response('<a href="https://instagram.com/acme">x</a>', 200)]);

        (new EnrichLeadJob($lead->id))->handle(app(WebsiteEnrichmentService::class));

        $lead->refresh();
        $this->assertNotEmpty($lead->socials);
        $this->assertNotNull($lead->enriched_at);
    }

    public function test_enrich_handles_unreachable_site_gracefully(): void
    {
        Http::fake(['*' => fn () => throw new \Exception('down')]);

        $result = app(WebsiteEnrichmentService::class)->enrich('https://acme.com');

        $this->assertSame(['socials' => [], 'emails' => [], 'phones' => []], $result);
    }
}
