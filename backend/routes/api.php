<?php

use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

Route::get('/dashboard',              [DashboardController::class, 'summary']);
Route::apiResource('categories',      CategoryController::class);
Route::apiResource('wallets',         WalletController::class);
Route::apiResource('transactions',    TransactionController::class);
Route::get('/budgets',                [BudgetController::class, 'index']);
Route::post('/budgets',               [BudgetController::class, 'store']);
Route::delete('/budgets/{budget}',    [BudgetController::class, 'destroy']);
