<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'user_id', 'wallet_id', 'category_id', 'name', 'icon', 'color',
        'amount', 'billing_cycle', 'next_billing_date', 'start_date',
        'is_active', 'notes',
    ];

    protected $casts = [
        'next_billing_date' => 'date',
        'start_date'        => 'date',
        'is_active'         => 'boolean',
        'amount'            => 'decimal:2',
    ];

    protected $appends = ['yearly_cost'];

    public function user()     { return $this->belongsTo(User::class); }
    public function wallet()   { return $this->belongsTo(Wallet::class); }
    public function category() { return $this->belongsTo(Category::class); }

    public function getYearlyCostAttribute(): float
    {
        return match ($this->billing_cycle) {
            'weekly'    => (float) $this->amount * 52,
            'monthly'   => (float) $this->amount * 12,
            'quarterly' => (float) $this->amount * 4,
            'yearly'    => (float) $this->amount,
            default     => (float) $this->amount * 12,
        };
    }
}