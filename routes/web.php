<?php

use App\Http\Controllers\LeadController;
use App\Http\Controllers\SearchController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Public lead-generation flow (no auth — anyone who fills the form sees results).
Route::get('/leads', [LeadController::class, 'index'])->name('leads.index');
Route::get('/searches', [SearchController::class, 'index'])->name('searches.index');
Route::get('/searches/{search}', [SearchController::class, 'show'])->name('searches.show');
Route::delete('/searches/{search}', [SearchController::class, 'destroy'])->name('searches.destroy');
Route::delete('/leads/{lead}', [LeadController::class, 'destroyLead'])->name('leads.destroy');
Route::post('/leads/{lead}/analyze', [LeadController::class, 'analyze'])->name('leads.analyze');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
