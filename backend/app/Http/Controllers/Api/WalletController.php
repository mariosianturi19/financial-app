<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WalletController extends Controller
{
    public function index()
    {
        return response()->json(
            Wallet::where('user_id', Auth::id())->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:100',
            'balance'  => 'nullable|numeric',
            'currency' => 'nullable|string|max:10',
            'icon'     => 'nullable|string',
            'color'    => 'nullable|string',
        ]);

        $wallet = Wallet::create([
            'user_id'  => Auth::id(),
            'name'     => $request->name,
            'balance'  => $request->balance  ?? 0,
            'currency' => $request->currency ?? 'IDR',
            'icon'     => $request->icon,
            'color'    => $request->color    ?? '#10b981',
        ]);

        return response()->json($wallet, 201);
    }

    public function show(string $id)
    {
        $wallet = Wallet::where('user_id', Auth::id())->findOrFail($id);
        return response()->json($wallet);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'name'     => 'sometimes|string|max:100',
            'balance'  => 'sometimes|numeric',
            'currency' => 'nullable|string|max:10',
            'icon'     => 'nullable|string',
            'color'    => 'nullable|string',
        ]);

        $wallet = Wallet::where('user_id', Auth::id())->findOrFail($id);
        $wallet->update($request->only('name', 'balance', 'currency', 'icon', 'color'));
        return response()->json($wallet);
    }

    public function destroy(string $id)
    {
        $wallet = Wallet::where('user_id', Auth::id())->findOrFail($id);
        $wallet->delete();
        return response()->json(['message' => 'Dompet dihapus.']);
    }
}