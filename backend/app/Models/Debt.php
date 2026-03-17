<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Debt extends Model
{
    protected $fillable = [
        'user_id', 'wallet_id', 'counterparty', 'type',
        'original_amount', 'paid_amount', 'due_date',
        'description', 'status', 'color',
    ];

    protected $casts = [
        'due_date'        => 'date',
        'original_amount' => 'decimal:2',
        'paid_amount'     => 'decimal:2',
    ];

    protected $appends = ['remaining_amount'];

    public function user()   { return $this->belongsTo(User::class); }
    public function wallet() { return $this->belongsTo(Wallet::class); }

    public function getRemainingAmountAttribute(): float
    {
        return max((float) $this->original_amount - (float) $this->paid_amount, 0);
    }
}