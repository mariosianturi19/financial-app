<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Wallet extends Model
{
    protected $fillable = [
        'user_id', 'name', 'balance', 'currency', 'icon', 'color',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Recalculate balance from scratch based on all transactions.
     * Menjamin saldo selalu konsisten dengan data transaksi yang ada.
     */
    public function recalculateBalance(): void
    {
        $balance = $this->transactions()
            ->selectRaw(
                "SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net"
            )
            ->value('net') ?? 0;

        $this->update(['balance' => (float) $balance]);
    }
}