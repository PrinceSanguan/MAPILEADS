<?php

namespace App\Models;

use Database\Factories\SearchFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'types',
    'country',
    'region',
    'province',
    'city',
    'location_label',
    'volume',
    'results_count',
])]
class Search extends Model
{
    /** @use HasFactory<SearchFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'types' => 'array',
        ];
    }

    /**
     * The businesses captured by this search.
     *
     * @return HasMany<Lead, $this>
     */
    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    /**
     * Compact camelCase shape for the history list.
     *
     * @return array<string, mixed>
     */
    public function toSummaryArray(): array
    {
        return [
            'id' => $this->id,
            'label' => $this->location_label,
            'types' => $this->types ?? [],
            'count' => $this->leads_count ?? $this->results_count,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
