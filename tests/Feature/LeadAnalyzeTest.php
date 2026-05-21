<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class LeadAnalyzeTest extends TestCase
{
    private function configureAnthropic(): void
    {
        config()->set('services.anthropic.key', 'test-key');
        config()->set('services.anthropic.model', 'claude-sonnet-4-6');
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

    /**
     * @return array<string, mixed>
     */
    private function validBody(): array
    {
        return [
            'name' => "Joe's Diner",
            'rating' => 4.3,
            'reviewCount' => 128,
            'types' => ['Restaurant'],
        ];
    }

    public function test_analyze_returns_structured_json(): void
    {
        $this->configureAnthropic();

        Http::fake([
            'api.anthropic.com/*' => Http::response($this->anthropicEnvelope(), 200),
        ]);

        $response = $this->postJson(
            route('leads.analyze', ['placeId' => 'ChIJ_test_1']),
            $this->validBody(),
        );

        $response->assertOk()->assertJsonStructure([
            'strengths',
            'painPoints',
            'reviewInsights',
            'email' => ['subject', 'body'],
        ]);
    }

    public function test_analyze_is_cached_by_place_id(): void
    {
        $this->configureAnthropic();

        Http::fake([
            'api.anthropic.com/*' => Http::response($this->anthropicEnvelope(), 200),
        ]);

        $this->postJson(route('leads.analyze', ['placeId' => 'ChIJ_test_1']), $this->validBody())->assertOk();
        $this->postJson(route('leads.analyze', ['placeId' => 'ChIJ_test_1']), $this->validBody())->assertOk();

        // Second call should be served from the array cache, not a new HTTP call.
        Http::assertSentCount(1);
    }

    public function test_analyze_sends_version_and_model(): void
    {
        $this->configureAnthropic();

        Http::fake([
            'api.anthropic.com/*' => Http::response($this->anthropicEnvelope(), 200),
        ]);

        $this->postJson(route('leads.analyze', ['placeId' => 'ChIJ_test_1']), $this->validBody());

        Http::assertSent(fn ($r) => $r->hasHeader('anthropic-version', '2023-06-01')
            && data_get($r->data(), 'model') === 'claude-sonnet-4-6'
        );
    }

    public function test_analyze_sends_prompt_cache_breakpoint(): void
    {
        $this->configureAnthropic();

        Http::fake([
            'api.anthropic.com/*' => Http::response($this->anthropicEnvelope(), 200),
        ]);

        $this->postJson(route('leads.analyze', ['placeId' => 'ChIJ_test_1']), $this->validBody());

        Http::assertSent(fn ($r) => data_get($r->data(), 'system.0.cache_control.type') === 'ephemeral');
    }

    public function test_analyze_validates_body(): void
    {
        $this->configureAnthropic();

        Http::fake();

        $response = $this->postJson(
            route('leads.analyze', ['placeId' => 'ChIJ_test_1']),
            [],
        );

        $response->assertStatus(422);
    }

    public function test_analyze_handles_upstream_error(): void
    {
        $this->configureAnthropic();

        Http::fake([
            'api.anthropic.com/*' => Http::response(['error' => ['message' => 'boom']], 500),
        ]);

        $response = $this->postJson(
            route('leads.analyze', ['placeId' => 'ChIJ_test_1']),
            $this->validBody(),
        );

        $response->assertStatus(502)->assertJsonStructure(['message']);
    }
}
