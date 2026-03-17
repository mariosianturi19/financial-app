<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::with('category', 'wallet')
                    ->where('user_id', Auth::id());

        if ($request->filled('type'))        $query->where('type', $request->type);
        if ($request->filled('wallet_id'))   $query->where('wallet_id', $request->wallet_id);
        if ($request->filled('category_id')) $query->where('category_id', $request->category_id);
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        $perPage = (int) $request->get('per_page', 20);
        $perPage = min(max($perPage, 5), 100); // clamp antara 5–100

        $paginated = $query->orderByDesc('date')
                           ->orderByDesc('id')
                           ->paginate($perPage);

        return response()->json([
            'data'          => $paginated->items(),
            'current_page'  => $paginated->currentPage(),
            'last_page'     => $paginated->lastPage(),
            'per_page'      => $paginated->perPage(),
            'total'         => $paginated->total(),
            'has_more'      => $paginated->hasMorePages(),
        ]);
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

        $wallet = Wallet::where('user_id', Auth::id())->findOrFail($request->wallet_id);

        $transaction = Transaction::create([
            'user_id'     => Auth::id(),
            'wallet_id'   => $request->wallet_id,
            'category_id' => $request->category_id,
            'type'        => $request->type,
            'amount'      => $request->amount,
            'description' => $request->description,
            'date'        => $request->date,
        ]);

        if ($request->type === 'income') {
            $wallet->increment('balance', $request->amount);
        } else {
            $wallet->decrement('balance', $request->amount);
        }

        return response()->json($transaction->load('category', 'wallet'), 201);
    }

    public function show(string $id)
    {
        $transaction = Transaction::with('category', 'wallet')
                          ->where('user_id', Auth::id())
                          ->findOrFail($id);
        return response()->json($transaction);
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

        $transaction = Transaction::where('user_id', Auth::id())->findOrFail($id);

        // Simpan nilai LAMA sebelum diubah apapun
        $oldWalletId = $transaction->wallet_id;
        $oldType     = $transaction->type;
        $oldAmount   = (float) $transaction->amount;

        // Reverse efek lama ke wallet lama
        $oldWallet = Wallet::where('user_id', Auth::id())->findOrFail($oldWalletId);
        if ($oldType === 'income') {
            $oldWallet->decrement('balance', $oldAmount);
        } else {
            $oldWallet->increment('balance', $oldAmount);
        }

        // Update transaksi dengan nilai baru
        $transaction->update($request->only(
            'wallet_id', 'category_id', 'type', 'amount', 'description', 'date'
        ));

        // Reload fresh dari DB agar nilai baru pasti ter-reflect
        $transaction->refresh();

        // Apply efek baru ke wallet baru
        $newWallet = Wallet::where('user_id', Auth::id())->findOrFail($transaction->wallet_id);
        if ($transaction->type === 'income') {
            $newWallet->increment('balance', (float) $transaction->amount);
        } else {
            $newWallet->decrement('balance', (float) $transaction->amount);
        }

        return response()->json($transaction->load('category', 'wallet'));
    }

    public function destroy(string $id)
    {
        $transaction = Transaction::where('user_id', Auth::id())->findOrFail($id);

        $wallet = Wallet::where('user_id', Auth::id())->findOrFail($transaction->wallet_id);
        if ($transaction->type === 'income') {
            $wallet->decrement('balance', (float) $transaction->amount);
        } else {
            $wallet->increment('balance', (float) $transaction->amount);
        }

        $transaction->delete();
        return response()->json(['message' => 'Transaksi dihapus.']);
    }
}