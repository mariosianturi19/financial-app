<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Transaction;
use App\Models\Wallet;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    // ── Advanced Analytics ──────────────────────────────────────
    public function advanced()
    {
        $userId = Auth::id();

        // Data 12 bulan terakhir
        $months = [];
        for ($i = 11; $i >= 0; $i--) {
            $date        = Carbon::now()->subMonths($i);
            $monthKey    = $date->format('Y-m');
            $monthLabel  = $date->format('M Y');

            $income  = (float) Transaction::where('user_id', $userId)->where('type', 'income')
                ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$monthKey])->sum('amount');
            $expense = (float) Transaction::where('user_id', $userId)->where('type', 'expense')
                ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$monthKey])->sum('amount');

            $months[] = [
                'month'      => $monthLabel,
                'month_key'  => $monthKey,
                'income'     => $income,
                'expense'    => $expense,
                'savings'    => $income - $expense,
                'savings_rate' => $income > 0 ? round((($income - $expense) / $income) * 100, 1) : 0,
            ];
        }

        // Top 5 kategori pengeluaran 3 bulan terakhir
        $topCategories = Transaction::select('category_id', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->where('user_id', $userId)
            ->where('type', 'expense')
            ->where('date', '>=', Carbon::now()->subMonths(3)->startOfMonth())
            ->groupBy('category_id')
            ->orderByDesc('total')
            ->limit(5)
            ->with('category')
            ->get()
            ->map(function ($item) {
                return [
                    'category'   => $item->category,
                    'total'      => (float) $item->total,
                    'count'      => $item->count,
                    'avg_per_tx' => $item->count > 0 ? round($item->total / $item->count, 0) : 0,
                ];
            });

        // Pengeluaran per hari dalam minggu (avg)
        $byDayOfWeek = Transaction::select(
                DB::raw('DAYOFWEEK(date) as day_num'),
                DB::raw('DAYNAME(date) as day_name'),
                DB::raw('AVG(amount) as avg_amount'),
                DB::raw('COUNT(*) as count')
            )
            ->where('user_id', $userId)
            ->where('type', 'expense')
            ->where('date', '>=', Carbon::now()->subMonths(3))
            ->groupBy('day_num', 'day_name')
            ->orderBy('day_num')
            ->get()
            ->map(fn ($r) => [
                'day'    => $r->day_name,
                'avg'    => (float) round($r->avg_amount, 0),
                'count'  => $r->count,
            ]);

        // Pengeluaran per minggu dalam bulan
        $byWeekOfMonth = Transaction::select(
                DB::raw('WEEK(date, 1) - WEEK(DATE_FORMAT(date, "%Y-%m-01"), 1) + 1 as week_num'),
                DB::raw('SUM(amount) as total')
            )
            ->where('user_id', $userId)
            ->where('type', 'expense')
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [now()->format('Y-m')])
            ->groupBy('week_num')
            ->orderBy('week_num')
            ->get();

        // Net worth history (12 bulan) — simulasi dari balance saat ini minus/plus perubahan
        $currentBalance = (float) Wallet::where('user_id', $userId)->sum('balance');
        $netWorthHistory = $this->buildNetWorthHistory($userId, $currentBalance, $months);

        // Income vs Expense ratio (3 bulan)
        $last3months = array_slice($months, -3);
        $avgIncome   = collect($last3months)->avg('income');
        $avgExpense  = collect($last3months)->avg('expense');

        return response()->json([
            'monthly_data'     => $months,
            'top_categories'   => $topCategories,
            'by_day_of_week'   => $byDayOfWeek,
            'by_week_of_month' => $byWeekOfMonth,
            'net_worth_history'=> $netWorthHistory,
            'avg_monthly_income'  => round($avgIncome, 0),
            'avg_monthly_expense' => round($avgExpense, 0),
            'avg_savings_rate'    => $avgIncome > 0 ? round((($avgIncome - $avgExpense) / $avgIncome) * 100, 1) : 0,
        ]);
    }

    // ── Forecasting (Linear Regression sederhana) ────────────────
    public function forecast()
    {
        $userId = Auth::id();

        // Kumpulkan data 6 bulan terakhir sebagai basis
        $historicalMonths = 6;
        $dataPoints = [];
        for ($i = $historicalMonths - 1; $i >= 0; $i--) {
            $date    = Carbon::now()->subMonths($i);
            $monthKey = $date->format('Y-m');
            $x        = $historicalMonths - $i; // x = 1..6

            $income  = (float) Transaction::where('user_id', $userId)->where('type', 'income')
                ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$monthKey])->sum('amount');
            $expense = (float) Transaction::where('user_id', $userId)->where('type', 'expense')
                ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$monthKey])->sum('amount');

            $dataPoints[] = compact('x', 'income', 'expense', 'monthKey');
        }

        // Linear regression: y = a + bx
        $forecastIncome  = $this->linearRegression(array_column($dataPoints, 'x'), array_column($dataPoints, 'income'));
        $forecastExpense = $this->linearRegression(array_column($dataPoints, 'x'), array_column($dataPoints, 'expense'));

        // Proyeksi 3 bulan ke depan
        $projections = [];
        for ($i = 1; $i <= 3; $i++) {
            $x     = $historicalMonths + $i;
            $date  = Carbon::now()->addMonths($i);

            $projIncome  = max(0, $forecastIncome['a'] + $forecastIncome['b'] * $x);
            $projExpense = max(0, $forecastExpense['a'] + $forecastExpense['b'] * $x);

            $projections[] = [
                'month'            => $date->format('M Y'),
                'month_key'        => $date->format('Y-m'),
                'projected_income' => round($projIncome, 0),
                'projected_expense'=> round($projExpense, 0),
                'projected_savings'=> round($projIncome - $projExpense, 0),
                'confidence'       => $this->calcConfidence($forecastIncome['r2'], $forecastExpense['r2']),
            ];
        }

        // Historical + projected gabungan untuk chart
        $chartData = [];
        foreach ($dataPoints as $dp) {
            $date = Carbon::now()->subMonths($historicalMonths - $dp['x']);
            $chartData[] = [
                'month'             => $date->format('M Y'),
                'income'            => $dp['income'],
                'expense'           => $dp['expense'],
                'type'              => 'actual',
            ];
        }
        foreach ($projections as $proj) {
            $chartData[] = [
                'month'             => $proj['month'],
                'projected_income'  => $proj['projected_income'],
                'projected_expense' => $proj['projected_expense'],
                'type'              => 'forecast',
            ];
        }

        // Prediksi saldo akhir bulan ini
        $currentMonth     = now()->format('Y-m');
        $daysInMonth      = now()->daysInMonth;
        $daysPassed       = now()->day;
        $remainingDays    = $daysInMonth - $daysPassed;
        $currentIncome    = (float) Transaction::where('user_id', $userId)->where('type', 'income')
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$currentMonth])->sum('amount');
        $currentExpense   = (float) Transaction::where('user_id', $userId)->where('type', 'expense')
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$currentMonth])->sum('amount');
        $dailyBurnRate    = $daysPassed > 0 ? $currentExpense / $daysPassed : 0;
        $projectedMonthEnd = $currentExpense + ($dailyBurnRate * $remainingDays);
        $currentBalance   = (float) Wallet::where('user_id', $userId)->sum('balance');

        return response()->json([
            'projections'           => $projections,
            'chart_data'            => $chartData,
            'daily_burn_rate'       => round($dailyBurnRate, 0),
            'projected_month_end_expense' => round($projectedMonthEnd, 0),
            'current_month_expense' => $currentExpense,
            'current_balance'       => $currentBalance,
            'income_trend'          => $forecastIncome['b'] > 0 ? 'up' : ($forecastIncome['b'] < -0.05 ? 'down' : 'stable'),
            'expense_trend'         => $forecastExpense['b'] > 0 ? 'up' : ($forecastExpense['b'] < -0.05 ? 'down' : 'stable'),
        ]);
    }

    // ── Smart Insights (rules-based) ────────────────────────────
    public function insights()
    {
        $userId   = Auth::id();
        $insights = [];
        $now      = Carbon::now();

        $currentMonth  = $now->format('Y-m');
        $lastMonth     = $now->copy()->subMonth()->format('Y-m');
        $last3Start    = $now->copy()->subMonths(3)->startOfMonth();

        $curExpense  = (float) Transaction::where('user_id', $userId)->where('type', 'expense')
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$currentMonth])->sum('amount');
        $curIncome   = (float) Transaction::where('user_id', $userId)->where('type', 'income')
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$currentMonth])->sum('amount');
        $lastExpense = (float) Transaction::where('user_id', $userId)->where('type', 'expense')
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$lastMonth])->sum('amount');
        $lastIncome  = (float) Transaction::where('user_id', $userId)->where('type', 'income')
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$lastMonth])->sum('amount');

        // 1. Pengeluaran naik signifikan dibanding bulan lalu
        if ($lastExpense > 0 && $curExpense > 0) {
            $pctChange = (($curExpense - $lastExpense) / $lastExpense) * 100;
            if ($pctChange > 20) {
                $insights[] = [
                    'type'     => 'warning',
                    'icon'     => '📈',
                    'title'    => 'Pengeluaran Meningkat',
                    'message'  => sprintf('Pengeluaran bulan ini naik %.1f%% dibanding bulan lalu. Perlu perhatian.', $pctChange),
                    'priority' => 1,
                ];
            } elseif ($pctChange < -15) {
                $insights[] = [
                    'type'     => 'success',
                    'icon'     => '✅',
                    'title'    => 'Pengeluaran Menurun',
                    'message'  => sprintf('Pengeluaran bulan ini turun %.1f%% — kerja bagus!', abs($pctChange)),
                    'priority' => 3,
                ];
            }
        }

        // 2. Cek budget overrun per kategori
        $budgets = Budget::with('category')
            ->where('user_id', $userId)
            ->where('month', $currentMonth)
            ->get();

        foreach ($budgets as $budget) {
            $spent = (float) Transaction::where('user_id', $userId)
                ->where('category_id', $budget->category_id)
                ->where('type', 'expense')
                ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$currentMonth])
                ->sum('amount');

            $pct = $budget->amount > 0 ? ($spent / $budget->amount) * 100 : 0;

            if ($pct >= 100) {
                $insights[] = [
                    'type'     => 'danger',
                    'icon'     => '🚨',
                    'title'    => 'Budget Terlampaui: ' . ($budget->category->name ?? 'Kategori'),
                    'message'  => sprintf(
                        'Anggaran %s sudah terlampaui %.1f%%. Pengeluaran: %s dari %s.',
                        $budget->category->name ?? 'ini',
                        $pct - 100,
                        'Rp ' . number_format($spent, 0, ',', '.'),
                        'Rp ' . number_format($budget->amount, 0, ',', '.')
                    ),
                    'priority' => 1,
                ];
            } elseif ($pct >= 80) {
                $insights[] = [
                    'type'     => 'warning',
                    'icon'     => '⚠️',
                    'title'    => 'Budget Hampir Habis: ' . ($budget->category->name ?? 'Kategori'),
                    'message'  => sprintf('Anggaran %s sudah terpakai %.1f%%.', $budget->category->name ?? 'ini', $pct),
                    'priority' => 2,
                ];
            }
        }

        // 3. Saving rate
        if ($curIncome > 0) {
            $savingRate = (($curIncome - $curExpense) / $curIncome) * 100;
            if ($savingRate < 0) {
                $insights[] = [
                    'type'     => 'danger',
                    'icon'     => '💸',
                    'title'    => 'Pengeluaran Melebihi Pemasukan',
                    'message'  => sprintf('Bulan ini kamu defisit %s. Kurangi pengeluaran atau cari sumber pendapatan tambahan.',
                        'Rp ' . number_format($curExpense - $curIncome, 0, ',', '.')),
                    'priority' => 1,
                ];
            } elseif ($savingRate < 10) {
                $insights[] = [
                    'type'     => 'warning',
                    'icon'     => '⚡',
                    'title'    => 'Saving Rate Rendah',
                    'message'  => sprintf('Hanya %.1f%% penghasilan yang tersimpan bulan ini. Idealnya minimal 20%%.', $savingRate),
                    'priority' => 2,
                ];
            } elseif ($savingRate >= 30) {
                $insights[] = [
                    'type'     => 'success',
                    'icon'     => '🌟',
                    'title'    => 'Saving Rate Excellent',
                    'message'  => sprintf('%.1f%% penghasilan tersimpan — kamu di jalur yang sangat baik!', $savingRate),
                    'priority' => 4,
                ];
            }
        }

        // 4. Kategori pengeluaran terbesar 3 bulan
        $topCategory = Transaction::select('category_id', DB::raw('SUM(amount) as total'))
            ->where('user_id', $userId)
            ->where('type', 'expense')
            ->where('date', '>=', $last3Start)
            ->groupBy('category_id')
            ->orderByDesc('total')
            ->with('category')
            ->first();

        if ($topCategory && $curExpense > 0) {
            $catShare = $topCategory->total > 0
                ? (Transaction::where('user_id', $userId)->where('type', 'expense')
                    ->where('category_id', $topCategory->category_id)
                    ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$currentMonth])
                    ->sum('amount') / $curExpense) * 100
                : 0;

            if ($catShare > 50) {
                $insights[] = [
                    'type'     => 'info',
                    'icon'     => '🔍',
                    'title'    => 'Konsentrasi Pengeluaran Tinggi',
                    'message'  => sprintf(
                        '%.1f%% pengeluaran bulan ini berasal dari kategori "%s". Pertimbangkan diversifikasi.',
                        $catShare,
                        $topCategory->category->name ?? 'tidak diketahui'
                    ),
                    'priority' => 3,
                ];
            }
        }



        // 7. Emergency fund check
        $monthlyAvgExpense = 0;
        for ($i = 1; $i <= 3; $i++) {
            $m = now()->subMonths($i)->format('Y-m');
            $monthlyAvgExpense += (float) Transaction::where('user_id', $userId)->where('type', 'expense')
                ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$m])->sum('amount');
        }
        $monthlyAvgExpense = $monthlyAvgExpense / 3;
        $totalBalance      = (float) Wallet::where('user_id', $userId)->sum('balance');
        $monthsCovered     = $monthlyAvgExpense > 0 ? $totalBalance / $monthlyAvgExpense : 0;

        if ($monthsCovered < 3 && $monthlyAvgExpense > 0) {
            $insights[] = [
                'type'     => 'warning',
                'icon'     => '🛡️',
                'title'    => 'Dana Darurat Kurang',
                'message'  => sprintf(
                    'Saldo saat ini hanya cukup untuk %.1f bulan pengeluaran. Idealnya 3-6 bulan sebagai dana darurat.',
                    $monthsCovered
                ),
                'priority' => 2,
            ];
        } elseif ($monthsCovered >= 6) {
            $insights[] = [
                'type'     => 'success',
                'icon'     => '🛡️',
                'title'    => 'Dana Darurat Aman',
                'message'  => sprintf('Saldo mencukupi %.1f bulan pengeluaran. Dana darurat kamu sangat solid!', $monthsCovered),
                'priority' => 4,
            ];
        }

        // 8. Tidak ada pemasukan bulan ini
        if ($curIncome == 0 && now()->day > 5) {
            $insights[] = [
                'type'     => 'warning',
                'icon'     => '💡',
                'title'    => 'Belum Ada Pemasukan Tercatat',
                'message'  => 'Belum ada pemasukan yang dicatat bulan ini. Pastikan semua sumber pendapatan tercatat.',
                'priority' => 2,
            ];
        }

        // 9. Pengeluaran harian rate vs avg
        $daysPassed    = now()->day;
        $dailyBurnRate = $daysPassed > 0 ? $curExpense / $daysPassed : 0;
        $avgDailyBurn  = $lastExpense > 0 ? $lastExpense / now()->daysInMonth : 0;

        if ($avgDailyBurn > 0 && $dailyBurnRate > $avgDailyBurn * 1.3) {
            $insights[] = [
                'type'     => 'warning',
                'icon'     => '🔥',
                'title'    => 'Laju Pengeluaran Tinggi',
                'message'  => sprintf(
                    'Rata-rata pengeluaran harian bulan ini %s/hari, lebih tinggi %.0f%% dari bulan lalu.',
                    'Rp ' . number_format($dailyBurnRate, 0, ',', '.'),
                    (($dailyBurnRate - $avgDailyBurn) / $avgDailyBurn) * 100
                ),
                'priority' => 2,
            ];
        }

        // Sort by priority
        usort($insights, fn ($a, $b) => $a['priority'] <=> $b['priority']);

        return response()->json([
            'insights'       => array_values($insights),
            'total_insights' => count($insights),
            'has_warnings'   => collect($insights)->whereIn('type', ['warning', 'danger'])->count() > 0,
        ]);
    }

    // ── Helper: Linear Regression ────────────────────────────────
    private function linearRegression(array $xs, array $ys): array
    {
        $n = count($xs);
        if ($n < 2) return ['a' => $ys[0] ?? 0, 'b' => 0, 'r2' => 0];

        $sumX  = array_sum($xs);
        $sumY  = array_sum($ys);
        $sumXY = 0;
        $sumX2 = 0;

        for ($i = 0; $i < $n; $i++) {
            $sumXY += $xs[$i] * $ys[$i];
            $sumX2 += $xs[$i] * $xs[$i];
        }

        $denom = ($n * $sumX2 - $sumX * $sumX);
        if ($denom == 0) return ['a' => $sumY / $n, 'b' => 0, 'r2' => 0];

        $b = ($n * $sumXY - $sumX * $sumY) / $denom;
        $a = ($sumY - $b * $sumX) / $n;

        // R-squared
        $meanY  = $sumY / $n;
        $ssTot  = 0; $ssRes = 0;
        for ($i = 0; $i < $n; $i++) {
            $ssTot += ($ys[$i] - $meanY) ** 2;
            $ssRes += ($ys[$i] - ($a + $b * $xs[$i])) ** 2;
        }
        $r2 = $ssTot > 0 ? 1 - $ssRes / $ssTot : 0;

        return ['a' => $a, 'b' => $b, 'r2' => max(0, $r2)];
    }

    private function calcConfidence(float $r2Income, float $r2Expense): string
    {
        $avg = ($r2Income + $r2Expense) / 2;
        if ($avg >= 0.7)  return 'high';
        if ($avg >= 0.4)  return 'medium';
        return 'low';
    }

    private function buildNetWorthHistory(int $userId, float $currentBalance, array $months): array
    {
        // Rekonstruksi net worth history dari balance saat ini
        $history   = [];
        $balance   = $currentBalance;
        $reversed  = array_reverse($months);

        foreach ($reversed as $i => $m) {
            $history[] = [
                'month'     => $m['month'],
                'net_worth' => round($balance, 0),
            ];
            // Untuk bulan sebelumnya, kurangi savings bulan ini
            $balance -= $m['savings'];
        }

        return array_reverse($history);
    }
}