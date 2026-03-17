<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
{
    public function index()
    {
        $subs = Subscription::with('wallet', 'category')
            ->where('user_id', Auth::id())
            ->orderBy('next_billing_date')
            ->get();

        $totalMonthly = $subs->where('is_active', true)->sum(function ($s) {
            return match ($s->billing_cycle) {
                'weekly'    => (float) $s->amount * 52 / 12,
                'monthly'   => (float) $s->amount,
                'quarterly' => (float) $s->amount / 3,
                'yearly'    => (float) $s->amount / 12,
                default     => (float) $s->amount,
            };
        });

        return response()->json([
            'data'          => $subs,
            'total_monthly' => round($totalMonthly, 2),
            'total_yearly'  => round($totalMonthly * 12, 2),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'              => 'required|string|max:100',
            'icon'              => 'nullable|string',
            'color'             => 'nullable|string',
            'amount'            => 'required|numeric|min:1',
            'billing_cycle'     => 'required|in:weekly,monthly,quarterly,yearly',
            'next_billing_date' => 'required|date',
            'start_date'        => 'required|date',
            'wallet_id'         => 'required|exists:wallets,id',
            'category_id'       => 'nullable|exists:categories,id',
            'notes'             => 'nullable|string|max:255',
        ]);

        $sub = Subscription::create([
            'user_id'           => Auth::id(),
            'wallet_id'         => $request->wallet_id,
            'category_id'       => $request->category_id,
            'name'              => $request->name,
            'icon'              => $request->icon,
            'color'             => $request->color ?? '#f43f5e',
            'amount'            => $request->amount,
            'billing_cycle'     => $request->billing_cycle,
            'next_billing_date' => $request->next_billing_date,
            'start_date'        => $request->start_date,
            'is_active'         => true,
            'notes'             => $request->notes,
        ]);

        return response()->json($sub->load('wallet', 'category'), 201);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'name'              => 'sometimes|string|max:100',
            'icon'              => 'nullable|string',
            'color'             => 'nullable|string',
            'amount'            => 'sometimes|numeric|min:1',
            'billing_cycle'     => 'sometimes|in:weekly,monthly,quarterly,yearly',
            'next_billing_date' => 'sometimes|date',
            'wallet_id'         => 'sometimes|exists:wallets,id',
            'category_id'       => 'nullable|exists:categories,id',
            'is_active'         => 'sometimes|boolean',
            'notes'             => 'nullable|string|max:255',
        ]);

        $sub = Subscription::where('user_id', Auth::id())->findOrFail($id);
        $sub->update($request->only(
            'name', 'icon', 'color', 'amount', 'billing_cycle',
            'next_billing_date', 'wallet_id', 'category_id', 'is_active', 'notes'
        ));

        return response()->json($sub->load('wallet', 'category'));
    }

    public function destroy(string $id)
    {
        Subscription::where('user_id', Auth::id())->findOrFail($id)->delete();
        return response()->json(['message' => 'Langganan dihapus.']);
    }
}