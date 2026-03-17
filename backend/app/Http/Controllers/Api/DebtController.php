<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Debt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DebtController extends Controller
{
    public function index()
    {
        $debts = Debt::with('wallet')
            ->where('user_id', Auth::id())
            ->orderByRaw("FIELD(status, 'active', 'partially_paid', 'paid')")
            ->orderBy('due_date')
            ->get();

        $totalDebt       = $debts->where('type', 'debt')->where('status', '!=', 'paid')
                                  ->sum('remaining_amount');
        $totalReceivable = $debts->where('type', 'receivable')->where('status', '!=', 'paid')
                                  ->sum('remaining_amount');

        return response()->json([
            'data'             => $debts,
            'total_debt'       => (float) $totalDebt,
            'total_receivable' => (float) $totalReceivable,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'wallet_id'       => 'required|exists:wallets,id',
            'counterparty'    => 'required|string|max:100',
            'type'            => 'required|in:debt,receivable',
            'original_amount' => 'required|numeric|min:1',
            'due_date'        => 'nullable|date',
            'description'     => 'nullable|string|max:255',
            'color'           => 'nullable|string',
        ]);

        $debt = Debt::create([
            'user_id'         => Auth::id(),
            'wallet_id'       => $request->wallet_id,
            'counterparty'    => $request->counterparty,
            'type'            => $request->type,
            'original_amount' => $request->original_amount,
            'paid_amount'     => 0,
            'due_date'        => $request->due_date,
            'description'     => $request->description,
            'status'          => 'active',
            'color'           => $request->color ?? '#f59e0b',
        ]);

        return response()->json($debt->load('wallet'), 201);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'counterparty'    => 'sometimes|string|max:100',
            'original_amount' => 'sometimes|numeric|min:1',
            'due_date'        => 'nullable|date',
            'description'     => 'nullable|string|max:255',
            'color'           => 'nullable|string',
            'status'          => 'sometimes|in:active,paid,partially_paid',
        ]);

        $debt = Debt::where('user_id', Auth::id())->findOrFail($id);
        $debt->update($request->only(
            'counterparty', 'original_amount', 'due_date',
            'description', 'color', 'status'
        ));

        return response()->json($debt->load('wallet'));
    }

    public function pay(Request $request, string $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $debt      = Debt::where('user_id', Auth::id())->findOrFail($id);
        $newPaid   = (float) $debt->paid_amount + (float) $request->amount;
        $newPaid   = min($newPaid, (float) $debt->original_amount);
        $newStatus = $newPaid >= (float) $debt->original_amount ? 'paid' : 'partially_paid';

        $debt->update([
            'paid_amount' => $newPaid,
            'status'      => $newStatus,
        ]);

        return response()->json($debt->fresh()->load('wallet'));
    }

    public function destroy(string $id)
    {
        Debt::where('user_id', Auth::id())->findOrFail($id)->delete();
        return response()->json(['message' => 'Hutang/piutang dihapus.']);
    }
}