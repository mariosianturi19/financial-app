<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

// ── Public ──────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// ── Protected ───────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Core
    Route::get('/dashboard',           [DashboardController::class, 'summary']);
    Route::apiResource('categories',   CategoryController::class);
    Route::apiResource('wallets',      WalletController::class);
    Route::apiResource('transactions', TransactionController::class);

    // Budgets
    Route::get('/budgets',             [BudgetController::class, 'index']);
    Route::post('/budgets',            [BudgetController::class, 'store']);
    Route::delete('/budgets/{budget}', [BudgetController::class, 'destroy']);

    // Analytics & Intelligence
    Route::get('/analytics/advanced', [AnalyticsController::class, 'advanced']);
    Route::get('/analytics/forecast', [AnalyticsController::class, 'forecast']);
    Route::get('/analytics/insights', [AnalyticsController::class, 'insights']);
});