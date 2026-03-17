<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinancialGoal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FinancialGoalController extends Controller
{
    public function index()
    {
        $goals = FinancialGoal::where('user_id', Auth::id())
            ->orderByRaw("FIELD(status, 'active', 'partially_paid', 'completed', 'cancelled')")
            ->orderBy('target_date')
            ->get();

        return response()->json($goals);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'          => 'required|string|max:100',
            'icon'          => 'nullable|string',
            'color'         => 'nullable|string',
            'target_amount' => 'required|numeric|min:1',
            'current_amount'=> 'nullable|numeric|min:0',
            'target_date'   => 'nullable|date|after:today',
            'notes'         => 'nullable|string|max:500',
        ]);

        $goal = FinancialGoal::create([
            'user_id'        => Auth::id(),
            'name'           => $request->name,
            'icon'           => $request->icon,
            'color'          => $request->color ?? '#6366f1',
            'target_amount'  => $request->target_amount,
            'current_amount' => $request->current_amount ?? 0,
            'target_date'    => $request->target_date,
            'notes'          => $request->notes,
            'status'         => 'active',
        ]);

        return response()->json($goal, 201);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'name'           => 'sometimes|string|max:100',
            'icon'           => 'nullable|string',
            'color'          => 'nullable|string',
            'target_amount'  => 'sometimes|numeric|min:1',
            'current_amount' => 'sometimes|numeric|min:0',
            'target_date'    => 'nullable|date',
            'status'         => 'sometimes|in:active,completed,cancelled',
            'notes'          => 'nullable|string|max:500',
        ]);

        $goal = FinancialGoal::where('user_id', Auth::id())->findOrFail($id);
        $goal->update($request->only(
            'name', 'icon', 'color', 'target_amount',
            'current_amount', 'target_date', 'status', 'notes'
        ));

        // Auto-complete jika current >= target
        if ((float) $goal->current_amount >= (float) $goal->target_amount && $goal->status === 'active') {
            $goal->update(['status' => 'completed']);
        }

        return response()->json($goal->fresh());
    }

    public function addFunds(Request $request, string $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $goal = FinancialGoal::where('user_id', Auth::id())->findOrFail($id);
        $newAmount = (float) $goal->current_amount + (float) $request->amount;
        $goal->update(['current_amount' => $newAmount]);

        // Auto-complete
        if ($newAmount >= (float) $goal->target_amount && $goal->status === 'active') {
            $goal->update(['status' => 'completed']);
        }

        return response()->json($goal->fresh());
    }

    public function destroy(string $id)
    {
        FinancialGoal::where('user_id', Auth::id())->findOrFail($id)->delete();
        return response()->json(['message' => 'Goal dihapus.']);
    }
}