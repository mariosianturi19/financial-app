<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::id();
        $month  = $request->input('month', now()->format('Y-m'));

        $budgets = Budget::with('category')
            ->where('user_id', $userId)
            ->where('month', $month)
            ->get();

        $budgets->each(function ($budget) use ($month, $userId) {
            $budget->spent = (float) Transaction::where('user_id', $userId)
                ->where('category_id', $budget->category_id)
                ->where('type', 'expense')
                ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$month])
                ->sum('amount');
        });

        return response()->json($budgets);
    }

    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'amount'      => 'required|numeric|min:1',
            'month'       => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
        ]);

        $budget = Budget::updateOrCreate(
            [
                'user_id'     => Auth::id(),
                'category_id' => $request->category_id,
                'month'       => $request->month,
            ],
            ['amount' => $request->amount]
        );
        $budget->load('category');

        return response()->json($budget, 201);
    }

    public function destroy(string $id)
    {
        $budget = Budget::where('user_id', Auth::id())->findOrFail($id);
        $budget->delete();
        return response()->json(['message' => 'Budget dihapus.']);
    }
}
