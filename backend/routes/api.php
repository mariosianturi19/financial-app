<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DebtController;
use App\Http\Controllers\Api\FinancialGoalController;
use App\Http\Controllers\Api\RecurringTransactionController;
use App\Http\Controllers\Api\SubscriptionController;
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

    // Recurring
    Route::get('/recurring',         [RecurringTransactionController::class, 'index']);
    Route::post('/recurring',        [RecurringTransactionController::class, 'store']);
    Route::put('/recurring/{id}',    [RecurringTransactionController::class, 'update']);
    Route::delete('/recurring/{id}', [RecurringTransactionController::class, 'destroy']);
    Route::post('/recurring/process',[RecurringTransactionController::class, 'process']);

    // Goals
    Route::get('/goals',                 [FinancialGoalController::class, 'index']);
    Route::post('/goals',                [FinancialGoalController::class, 'store']);
    Route::put('/goals/{id}',            [FinancialGoalController::class, 'update']);
    Route::post('/goals/{id}/add-funds', [FinancialGoalController::class, 'addFunds']);
    Route::delete('/goals/{id}',         [FinancialGoalController::class, 'destroy']);

    // Subscriptions
    Route::get('/subscriptions',         [SubscriptionController::class, 'index']);
    Route::post('/subscriptions',        [SubscriptionController::class, 'store']);
    Route::put('/subscriptions/{id}',    [SubscriptionController::class, 'update']);
    Route::delete('/subscriptions/{id}', [SubscriptionController::class, 'destroy']);

    // Debts
    Route::get('/debts',           [DebtController::class, 'index']);
    Route::post('/debts',          [DebtController::class, 'store']);
    Route::put('/debts/{id}',      [DebtController::class, 'update']);
    Route::post('/debts/{id}/pay', [DebtController::class, 'pay']);
    Route::delete('/debts/{id}',   [DebtController::class, 'destroy']);

    // ── Fase 3: Analytics & Intelligence ─────────────────────────
    Route::get('/analytics/advanced', [AnalyticsController::class, 'advanced']);
    Route::get('/analytics/forecast', [AnalyticsController::class, 'forecast']);
    Route::get('/analytics/insights', [AnalyticsController::class, 'insights']);
});