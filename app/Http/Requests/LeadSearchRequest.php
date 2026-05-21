<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LeadSearchRequest extends FormRequest
{
    /**
     * The search endpoint is public.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'types' => ['sometimes', 'array', 'max:10'],
            'types.*' => ['string', 'max:80'],
            'country' => ['nullable', 'string', 'max:120'],
            'region' => ['nullable', 'string', 'max:120'],
            'province' => ['nullable', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:120'],
            'business' => ['sometimes', 'boolean'],
            'enriched' => ['sometimes', 'boolean'],
            'reviews' => ['sometimes', 'boolean'],
            'volume' => ['sometimes', 'integer', 'min:10', 'max:60'],
        ];
    }

    /**
     * Inertia sends query params as strings; coerce booleans before validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'business' => $this->toBool($this->input('business'), true),
            'enriched' => $this->toBool($this->input('enriched'), false),
            'reviews' => $this->toBool($this->input('reviews'), false),
        ]);
    }

    private function toBool(mixed $value, bool $default): bool
    {
        if ($value === null) {
            return $default;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
    }

    /**
     * Normalized filters for the services, with a clamped volume.
     *
     * @return array<string, mixed>
     */
    public function filters(): array
    {
        $data = $this->validated();
        $data['types'] = array_values(array_filter(
            $data['types'] ?? [],
            fn ($t) => is_string($t) && trim($t) !== '',
        ));
        $data['volume'] = (int) ($data['volume'] ?? 10);

        return $data;
    }
}
