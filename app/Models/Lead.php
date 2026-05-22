<?php

namespace App\Models;

use Database\Factories\LeadFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'search_id',
    'place_id',
    'name',
    'address',
    'lat',
    'lng',
    'rating',
    'review_count',
    'price_level',
    'phone',
    'website',
    'google_maps_uri',
    'business_status',
    'open_now',
    'types',
    'reviews',
    'opening_hours',
    'socials',
    'emails',
    'extra_phones',
    'ai_analysis',
    'ai_email',
    'editorial_summary',
    'ai_tone',
    'enriched_at',
    'analyzed_at',
])]
class Lead extends Model
{
    /** @use HasFactory<LeadFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lng' => 'float',
            'rating' => 'float',
            'review_count' => 'integer',
            'price_level' => 'integer',
            'types' => 'array',
            'reviews' => 'array',
            'opening_hours' => 'array',
            'socials' => 'array',
            'emails' => 'array',
            'extra_phones' => 'array',
            'ai_analysis' => 'array',
            'ai_email' => 'array',
            'open_now' => 'boolean',
            'enriched_at' => 'datetime',
            'analyzed_at' => 'datetime',
        ];
    }

    /**
     * The search this business belongs to.
     *
     * @return BelongsTo<Search, $this>
     */
    public function search(): BelongsTo
    {
        return $this->belongsTo(Search::class);
    }

    /**
     * The camelCase shape the React results page consumes.
     *
     * @return array<string, mixed>
     */
    public function toFrontendArray(): array
    {
        return [
            'id' => $this->id,
            'placeId' => $this->place_id,
            'name' => $this->name,
            'address' => $this->address,
            'lat' => (float) $this->lat,
            'lng' => (float) $this->lng,
            'rating' => $this->rating,
            'reviewCount' => $this->review_count,
            'priceLevel' => $this->price_level,
            'phone' => $this->phone,
            'website' => $this->website,
            'googleMapsUri' => $this->google_maps_uri,
            'types' => $this->types ?? [],
            'businessStatus' => $this->business_status,
            'openNow' => $this->open_now,
            'reviews' => $this->reviews ?? [],
            'socials' => $this->socials ?? [],
            'emails' => $this->emails ?? [],
            'extraPhones' => $this->extra_phones ?? [],
            'openingHours' => $this->opening_hours,
            'editorialSummary' => $this->editorial_summary,
            'aiAnalysis' => $this->ai_analysis,
            'aiTone' => $this->ai_tone,
        ];
    }

    /**
     * The shape ClaudeService::analyzeBusiness() reads.
     *
     * @return array<string, mixed>
     */
    public function toAiArray(): array
    {
        return [
            'name' => $this->name,
            'address' => $this->address,
            'website' => $this->website,
            'phone' => $this->phone,
            'rating' => $this->rating,
            'reviewCount' => $this->review_count,
            'types' => $this->types ?? [],
            'reviews' => $this->reviews ?? [],
        ];
    }
}
