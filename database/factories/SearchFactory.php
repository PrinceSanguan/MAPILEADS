<?php

namespace Database\Factories;

use App\Models\Search;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Search>
 */
class SearchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $city = fake()->city();
        $country = fake()->country();

        return [
            'types' => fake()->randomElements(
                ['Restaurant', 'Cafe', 'Dentist', 'Gym', 'Bakery', 'Hair Salon'],
                fake()->numberBetween(1, 3),
            ),
            'country' => $country,
            'region' => null,
            'province' => null,
            'city' => $city,
            'location_label' => "{$city}, {$country}",
            'volume' => fake()->randomElement([10, 20, 30, 40, 50, 60]),
            'results_count' => fake()->numberBetween(0, 60),
        ];
    }
}
