<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialGoal extends Model
{
    protected $fillable = [
        'user_id', 'name', 'icon', 'color',
        'target_amount', 'current_amount',
        'target_date', 'status', 'notes',
    ];

    protected $casts = [
        'target_date'    => 'date',
        'target_amount'  => 'decimal:2',
        'current_amount' => 'decimal:2',
    ];

    protected $appends = ['progress_percentage', 'remaining_amount'];

    public function user() { return $this->belongsTo(User::class); }

    public function getProgressPercentageAttribute(): float
    {
        if ((float) $this->target_amount <= 0) return 0;
        return min(round(((float) $this->current_amount / (float) $this->target_amount) * 100, 1), 100);
    }

    public function getRemainingAmountAttribute(): float
    {
        return max((float) $this->target_amount - (float) $this->current_amount, 0);
    }
}