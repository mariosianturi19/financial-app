<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecurringTransaction;
use App\Models\Transaction;
use App\Models\Wallet;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RecurringTransactionController extends Controller
{
    public function index()
    {
        $items = RecurringTransaction::with('wallet', 'category')
            ->where('user_id', Auth::id())
            ->orderBy('next_due_date')
            ->get();

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $request->validate([
            'wallet_id'   => 'required|exists:wallets,id',
            'category_id' => 'required|exists:categories,id',
            'type'        => 'required|in:income,expense',
            'amount'      => 'required|numeric|min:1',
            'description' => 'nullable|string|max:255',
            'frequency'   => 'required|in:daily,weekly,monthly,yearly',
            'start_date'  => 'required|date',
            'end_date'    => 'nullable|date|after:start_date',
        ]);

        Wallet::where('user_id', Auth::id())->findOrFail($request->wallet_id);

        $item = RecurringTransaction::create([
            'user_id'       => Auth::id(),
            'wallet_id'     => $request->wallet_id,
            'category_id'   => $request->category_id,
            'type'          => $request->type,
            'amount'        => $request->amount,
            'description'   => $request->description,
            'frequency'     => $request->frequency,
            'start_date'    => $request->start_date,
            'next_due_date' => $request->start_date,
            'end_date'      => $request->end_date,
            'is_active'     => true,
        ]);

        return response()->json($item->load('wallet', 'category'), 201);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'wallet_id'   => 'sometimes|exists:wallets,id',
            'category_id' => 'sometimes|exists:categories,id',
            'type'        => 'sometimes|in:income,expense',
            'amount'      => 'sometimes|numeric|min:1',
            'description' => 'nullable|string|max:255',
            'frequency'   => 'sometimes|in:daily,weekly,monthly,yearly',
            'end_date'    => 'nullable|date',
            'is_active'   => 'sometimes|boolean',
        ]);

        $item = RecurringTransaction::where('user_id', Auth::id())->findOrFail($id);
        $item->update($request->only(
            'wallet_id', 'category_id', 'type', 'amount',
            'description', 'frequency', 'end_date', 'is_active'
        ));

        return response()->json($item->load('wallet', 'category'));
    }

    public function destroy(string $id)
    {
        RecurringTransaction::where('user_id', Auth::id())->findOrFail($id)->delete();
        return response()->json(['message' => 'Transaksi berulang dihapus.']);
    }

    /**
     * Eksekusi semua transaksi berulang yang sudah jatuh tempo.
     * Dipanggil manual dari frontend (tombol "Proses Sekarang").
     */
    public function process()
    {
        $userId  = Auth::id();
        $items   = RecurringTransaction::with('wallet')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->get();

        $processed = 0;

        foreach ($items as $item) {
            if (!$item->isDue()) continue;

            // Buat transaksi aktual
            Transaction::create([
                'user_id'     => $userId,
                'wallet_id'   => $item->wallet_id,
                'category_id' => $item->category_id,
                'type'        => $item->type,
                'amount'      => $item->amount,
                'description' => ($item->description ?? '') . ' (otomatis)',
                'date'        => $item->next_due_date->toDateString(),
            ]);

            // Update saldo wallet
            $wallet = Wallet::where('user_id', $userId)->find($item->wallet_id);
            if ($wallet) {
                $item->type === 'income'
                    ? $wallet->increment('balance', $item->amount)
                    : $wallet->decrement('balance', $item->amount);
            }

            // Hitung next_due_date berikutnya
            $nextDue = $item->calculateNextDueDate($item->next_due_date);

            // Non-aktifkan jika sudah melewati end_date
            $shouldDeactivate = $item->end_date && $nextDue->gt($item->end_date);

            $item->update([
                'next_due_date' => $nextDue->toDateString(),
                'is_active'     => !$shouldDeactivate,
            ]);

            $processed++;
        }

        return response()->json([
            'message'   => "$processed transaksi berulang berhasil diproses.",
            'processed' => $processed,
        ]);
    }
}