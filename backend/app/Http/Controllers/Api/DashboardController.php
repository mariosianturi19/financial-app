<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Wallet;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary()
    {
        $userId = Auth::id();
        $now    = now();
        $year   = (int) $now->format('Y');
        $month  = (int) $now->format('m');

        $totalBalance = Wallet::where('user_id', $userId)->sum('balance');

        $totalIncome = Transaction::where('user_id', $userId)
            ->where('type', 'income')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');

        $totalExpense = Transaction::where('user_id', $userId)
            ->where('type', 'expense')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');

        $recentTransactions = Transaction::with('category', 'wallet')
            ->where('user_id', $userId)
            ->orderByDesc('date')
            ->limit(5)
            ->get();

        $expenseByCategory = Transaction::select('category_id', DB::raw('SUM(amount) as total'))
            ->where('user_id', $userId)
            ->where('type', 'expense')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->groupBy('category_id')
            ->with('category')
            ->get();

        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $y    = (int) $date->format('Y');
            $m    = (int) $date->format('m');

            $monthlyTrend[] = [
                'month'   => $date->format('M Y'),
                'income'  => (float) Transaction::where('user_id', $userId)
                    ->where('type', 'income')
                    ->whereYear('date', $y)
                    ->whereMonth('date', $m)
                    ->sum('amount'),
                'expense' => (float) Transaction::where('user_id', $userId)
                    ->where('type', 'expense')
                    ->whereYear('date', $y)
                    ->whereMonth('date', $m)
                    ->sum('amount'),
            ];
        }

        return response()->json([
            'total_balance'       => (float) $totalBalance,
            'total_income'        => (float) $totalIncome,
            'total_expense'       => (float) $totalExpense,
            'recent_transactions' => $recentTransactions,
            'expense_by_category' => $expenseByCategory,
            'monthly_trend'       => $monthlyTrend,
        ]);
    }
}