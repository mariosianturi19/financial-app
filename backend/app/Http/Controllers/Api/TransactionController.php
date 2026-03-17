<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::with('category', 'wallet');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        if ($request->has('wallet_id')) {
            $query->where('wallet_id', $request->wallet_id);
        }
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        return response()->json($query->orderByDesc('date')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'wallet_id'   => 'required|exists:wallets,id',
            'category_id' => 'required|exists:categories,id',
            'type'        => 'required|in:income,expense',
            'amount'      => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'date'        => 'required|date',
        ]);

        $transaction = Transaction::create($request->only(
            'wallet_id', 'category_id', 'type', 'amount', 'description', 'date'
        ));

        $wallet = Wallet::findOrFail($request->wallet_id);
        if ($request->type === 'income') {
            $wallet->increment('balance', $request->amount);
        } else {
            $wallet->decrement('balance', $request->amount);
        }

        return response()->json($transaction->load('category', 'wallet'), 201);
    }

    public function show(string $id)
    {
        return response()->json(Transaction::with('category', 'wallet')->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'wallet_id'   => 'sometimes|exists:wallets,id',
            'category_id' => 'sometimes|exists:categories,id',
            'type'        => 'sometimes|in:income,expense',
            'amount'      => 'sometimes|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'date'        => 'sometimes|date',
        ]);

        $transaction = Transaction::findOrFail($id);

        // Reverse old balance effect
        $wallet = Wallet::findOrFail($transaction->wallet_id);
        if ($transaction->type === 'income') {
            $wallet->decrement('balance', $transaction->amount);
        } else {
            $wallet->increment('balance', $transaction->amount);
        }

        $transaction->update($request->only('wallet_id', 'category_id', 'type', 'amount', 'description', 'date'));

        // Apply new balance effect
        $newWallet = Wallet::findOrFail($transaction->wallet_id);
        $newType   = $request->type ?? $transaction->type;
        $newAmount = $request->amount ?? $transaction->amount;
        if ($newType === 'income') {
            $newWallet->increment('balance', $newAmount);
        } else {
            $newWallet->decrement('balance', $newAmount);
        }

        return response()->json($transaction->load('category', 'wallet'));
    }

    public function destroy(string $id)
    {
        $transaction = Transaction::findOrFail($id);

        $wallet = Wallet::findOrFail($transaction->wallet_id);
        if ($transaction->type === 'income') {
            $wallet->decrement('balance', $transaction->amount);
        } else {
            $wallet->increment('balance', $transaction->amount);
        }

        $transaction->delete();
        return response()->json(['message' => 'Transaksi dihapus.']);
    }
}
