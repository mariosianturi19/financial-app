<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Transaction;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        $month = $request->get('month', now()->format('Y-m'));
        $budgets = Budget::with('category')->where('month', $month)->get();

        $budgets->each(function ($budget) use ($month) {
            $budget->spent = (float) Transaction::where('category_id', $budget->category_id)
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
            ['category_id' => $request->category_id, 'month' => $request->month],
            ['amount' => $request->amount]
        );
        $budget->load('category');

        return response()->json($budget, 201);
    }

    public function destroy(string $id)
    {
        Budget::findOrFail($id)->delete();
        return response()->json(['message' => 'Budget dihapus.']);
    }
}
