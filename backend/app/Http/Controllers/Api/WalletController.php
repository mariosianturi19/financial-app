<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function index()
    {
        return response()->json(Wallet::all());
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

        $wallet = Wallet::create($request->only('name', 'balance', 'currency', 'icon', 'color'));
        return response()->json($wallet, 201);
    }

    public function show(string $id)
    {
        return response()->json(Wallet::findOrFail($id));
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

        $wallet = Wallet::findOrFail($id);
        $wallet->update($request->only('name', 'balance', 'currency', 'icon', 'color'));
        return response()->json($wallet);
    }

    public function destroy(string $id)
    {
        Wallet::findOrFail($id)->delete();
        return response()->json(['message' => 'Dompet dihapus.']);
    }
}
