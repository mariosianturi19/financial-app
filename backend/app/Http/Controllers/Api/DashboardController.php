<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Wallet;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary()
    {
        $totalBalance = Wallet::sum('balance');
        $currentMonth = now()->format('Y-m');

        $totalIncome = Transaction::where('type', 'income')
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$currentMonth])
            ->sum('amount');

        $totalExpense = Transaction::where('type', 'expense')
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$currentMonth])
            ->sum('amount');

        $recentTransactions = Transaction::with('category', 'wallet')
            ->orderByDesc('date')
            ->limit(5)
            ->get();

        $expenseByCategory = Transaction::select('category_id', DB::raw('SUM(amount) as total'))
            ->where('type', 'expense')
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$currentMonth])
            ->groupBy('category_id')
            ->with('category')
            ->get();

        // Tren 6 bulan terakhir
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $date  = Carbon::now()->subMonths($i);
            $month = $date->format('Y-m');
            $monthlyTrend[] = [
                'month'   => $date->format('M Y'),
                'income'  => (float) Transaction::where('type', 'income')
                    ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$month])->sum('amount'),
                'expense' => (float) Transaction::where('type', 'expense')
                    ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$month])->sum('amount'),
            ];
        }

        return response()->json([
            'total_balance'       => $totalBalance,
            'total_income'        => $totalIncome,
            'total_expense'       => $totalExpense,
            'recent_transactions' => $recentTransactions,
            'expense_by_category' => $expenseByCategory,
            'monthly_trend'       => $monthlyTrend,
        ]);
    }
}
