<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('search_id')->constrained()->cascadeOnDelete();
            $table->string('place_id')->index();
            $table->string('name');
            $table->string('address')->nullable();
            $table->double('lat')->default(0);
            $table->double('lng')->default(0);
            $table->float('rating')->nullable();
            $table->integer('review_count')->nullable();
            $table->integer('price_level')->nullable();
            $table->string('phone')->nullable();
            $table->text('website')->nullable();
            $table->text('google_maps_uri')->nullable();
            $table->string('business_status')->nullable();
            $table->boolean('open_now')->nullable();
            $table->json('types')->nullable();
            $table->json('reviews')->nullable();
            $table->json('opening_hours')->nullable();
            $table->json('socials')->nullable();
            $table->json('emails')->nullable();
            $table->json('extra_phones')->nullable();
            $table->json('ai_analysis')->nullable();
            $table->json('ai_email')->nullable();
            $table->text('editorial_summary')->nullable();
            $table->string('ai_tone')->nullable();
            $table->timestamp('enriched_at')->nullable();
            $table->timestamp('analyzed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
        Schema::dropIfExists('searches');
    }
};
