<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class RecurringTransaction extends Model
{
    protected $fillable = [
        'user_id', 'wallet_id', 'category_id', 'type', 'amount',
        'description', 'frequency', 'start_date', 'next_due_date',
        'end_date', 'is_active',
    ];

    protected $casts = [
        'start_date'    => 'date',
        'next_due_date' => 'date',
        'end_date'      => 'date',
        'is_active'     => 'boolean',
        'amount'        => 'decimal:2',
    ];

    public function user()     { return $this->belongsTo(User::class); }
    public function wallet()   { return $this->belongsTo(Wallet::class); }
    public function category() { return $this->belongsTo(Category::class); }

    public function calculateNextDueDate(Carbon $from): Carbon
    {
        return match ($this->frequency) {
            'daily'   => $from->copy()->addDay(),
            'weekly'  => $from->copy()->addWeek(),
            'monthly' => $from->copy()->addMonth(),
            'yearly'  => $from->copy()->addYear(),
            default   => $from->copy()->addMonth(),
        };
    }

    public function isDue(): bool
    {
        if (!$this->is_active) return false;
        if ($this->end_date && $this->next_due_date->gt($this->end_date)) return false;
        return $this->next_due_date->lte(now());
    }
}