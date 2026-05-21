<?php

use App\Http\Controllers\LeadController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Public lead-generation flow (no auth — anyone who fills the form sees results).
Route::get('/leads', [LeadController::class, 'index'])->name('leads.index');
Route::post('/leads/{placeId}/analyze', [LeadController::class, 'analyze'])->name('leads.analyze');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
