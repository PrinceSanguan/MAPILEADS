<?php

namespace Tests\Feature;

use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class LeadAnalyzeTest extends TestCase
{
    use RefreshDatabase;

    private function configureAnthropic(): void
    {
        config()->set('services.anthropic.key', 'test-key');
        config()->set('services.anthropic.model', 'claude-sonnet-4-6');
    }

    /**
     * A saved business to analyze, with reviews/types populated.
     */
    private function makeLead(): Lead
    {
        return Lead::factory()->create([
            'name' => "Joe's Diner",
            'rating' => 4.3,
            'review_count' => 128,
            'types' => ['Restaurant'],
            'reviews' => [[
                'author' => 'Jane R.',
                'rating' => 5,
                'text' => 'Great food and friendly staff.',
                'time' => '2024-01-01T00:00:00Z',
            ]],
            'ai_analysis' => null,
            'ai_email' => null,
            'ai_tone' => null,
            'analyzed_at' => null,
        ]);
    }

    /**
     * A successful Anthropic Messages API response envelope.
     *
     * @return array<string, mixed>
     */
    private function anthropicEnvelope(): array
    {
        return [
            'stop_reason' => 'end_turn',
            'content' => [[
                'type' => 'text',
                'text' => json_encode([
                    'strengths' => ['High 4.3 rating'],
                    'painPoints' => ['No online ordering'],
                    'reviewInsights' => ['Customers praise the staff'],
                    'email' => [
                        'subject' => 'Quick idea for Joes Diner',
                        'body' => 'Hi [Your Name]...',
                    ],
                ]),
            ]],
        ];
    }

    public function test_analyze_returns_and_persists(): void
    {
        $this->configureAnthropic();
        $lead = $this->makeLead();

        Http::fake([
            'api.anthropic.com/*' => Http::response($this->anthropicEnvelope(), 200),
        ]);

        $response = $this->postJson(route('leads.analyze', $lead), ['tone' => 'professional']);

        $response->assertOk()->assertJsonStructure([
            'strengths',
            'painPoints',
            'reviewInsights',
            'email' => ['subject', 'body'],
        ]);

        $this->assertDatabaseHas('leads', ['id' => $lead->id]);

        $lead->refresh();
        $this->assertNotNull($lead->analyzed_at);
        $this->assertSame('professional', $lead->ai_tone);
        $this->assertSame(['High 4.3 rating'], $lead->ai_analysis['strengths']);
        $this->assertSame('Quick idea for Joes Diner', $lead->ai_email['subject']);
    }

    public function test_analyze_reuses_persisted_result_without_calling_anthropic(): void
    {
        $this->configureAnthropic();
        $lead = $this->makeLead();

        Http::fake([
            'api.anthropic.com/*' => Http::response($this->anthropicEnvelope(), 200),
        ]);

        $this->postJson(route('leads.analyze', $lead), ['tone' => 'professional'])->assertOk();
        // Second call (same tone) should be served from the persisted analysis.
        $this->postJson(route('leads.analyze', $lead), ['tone' => 'professional'])->assertOk();

        Http::assertSentCount(1);
    }

    public function test_analyze_sends_version_and_model(): void
    {
        $this->configureAnthropic();
        $lead = $this->makeLead();

        Http::fake([
            'api.anthropic.com/*' => Http::response($this->anthropicEnvelope(), 200),
        ]);

        $this->postJson(route('leads.analyze', $lead), ['tone' => 'professional']);

        Http::assertSent(fn ($r) => $r->hasHeader('anthropic-version', '2023-06-01')
            && data_get($r->data(), 'model') === 'claude-sonnet-4-6'
        );
    }

    public function test_analyze_sends_prompt_cache_breakpoint(): void
    {
        $this->configureAnthropic();
        $lead = $this->makeLead();

        Http::fake([
            'api.anthropic.com/*' => Http::response($this->anthropicEnvelope(), 200),
        ]);

        $this->postJson(route('leads.analyze', $lead), ['tone' => 'professional']);

        Http::assertSent(fn ($r) => data_get($r->data(), 'system.0.cache_control.type') === 'ephemeral');
    }

    public function test_analyze_handles_upstream_error(): void
    {
        $this->configureAnthropic();
        $lead = $this->makeLead();

        Http::fake([
            'api.anthropic.com/*' => Http::response(['error' => ['message' => 'boom']], 500),
        ]);

        $response = $this->postJson(route('leads.analyze', $lead), ['tone' => 'professional']);

        $response->assertStatus(502)->assertJsonStructure(['message']);
    }

    public function test_analyze_returns_404_for_unknown_lead(): void
    {
        $this->configureAnthropic();

        Http::fake([
            'api.anthropic.com/*' => Http::response($this->anthropicEnvelope(), 200),
        ]);

        $response = $this->postJson(route('leads.analyze', ['lead' => 999999]), ['tone' => 'professional']);

        $response->assertNotFound();
        Http::assertNothingSent();
    }
}
