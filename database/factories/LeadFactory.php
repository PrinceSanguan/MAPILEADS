<?php

namespace Database\Factories;

use App\Models\Lead;
use App\Models\Search;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->company();

        return [
            'search_id' => Search::factory(),
            'place_id' => 'place_'.fake()->unique()->bothify('??????##########'),
            'name' => $name,
            'address' => fake()->address(),
            'lat' => fake()->latitude(),
            'lng' => fake()->longitude(),
            'rating' => fake()->randomFloat(1, 1, 5),
            'review_count' => fake()->numberBetween(0, 2000),
            'price_level' => fake()->numberBetween(0, 4),
            'phone' => fake()->phoneNumber(),
            'website' => fake()->url(),
            'google_maps_uri' => 'https://maps.google.com/?cid='.fake()->numerify('####################'),
            'business_status' => 'OPERATIONAL',
            'open_now' => fake()->boolean(),
            'types' => fake()->randomElements(
                ['Restaurant', 'Cafe', 'Bar', 'Bakery', 'Food'],
                fake()->numberBetween(1, 3),
            ),
            'reviews' => [
                [
                    'author' => fake()->name(),
                    'rating' => fake()->numberBetween(1, 5),
                    'text' => fake()->sentence(),
                    'time' => fake()->iso8601(),
                ],
            ],
            'opening_hours' => [
                'Monday: 9:00 AM – 5:00 PM',
                'Tuesday: 9:00 AM – 5:00 PM',
            ],
            'socials' => null,
            'emails' => null,
            'extra_phones' => null,
            'ai_analysis' => null,
            'ai_email' => null,
            'editorial_summary' => fake()->optional()->sentence(),
            'ai_tone' => null,
            'enriched_at' => null,
            'analyzed_at' => null,
        ];
    }
}
