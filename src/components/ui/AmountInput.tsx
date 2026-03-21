'use client';

import { useState, useRef, useEffect } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Wallet } from '@/types';

interface AmountInputProps {
  value: string;                        // raw numeric string e.g. "500000"
  onChange: (raw: string) => void;      // called with raw numeric string
  type: 'income' | 'expense';
  selectedWallet?: Wallet | null;       // used for balance validation on expense
  placeholder?: string;
  required?: boolean;
  editingTxId?: number | null;          // when editing an existing tx, pass its current amount to adjust available balance
  editingTxCurrentAmount?: number;      // the original amount of the tx being edited
}

/**
 * Formats a raw number string to locale-formatted display string.
 * e.g. "500000" → "500.000"
 */
function formatDisplay(raw: string): string {
  const num = parseInt(raw.replace(/\D/g, ''), 10);
  if (isNaN(num) || raw === '') return '';
  return num.toLocaleString('id-ID');
}

/**
 * Parses a locale-formatted display string back to raw numeric string.
 * e.g. "500.000" → "500000"
 */
function parseRaw(display: string): string {
  return display.replace(/\./g, '').replace(/[^\d]/g, '');
}

export default function AmountInput({
  value,
  onChange,
  type,
  selectedWallet,
  placeholder = '0',
  required = true,
  editingTxCurrentAmount = 0,
}: AmountInputProps) {
  const [display, setDisplay]   = useState(formatDisplay(value));
  const [focused, setFocused]   = useState(false);
  const inputRef                = useRef<HTMLInputElement>(null);

  // Sync display when value prop changes externally (e.g. form reset)
  useEffect(() => {
    setDisplay(formatDisplay(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw     = parseRaw(e.target.value);
    const display = formatDisplay(raw);
    setDisplay(display);
    onChange(raw);
  };

  /* ── Validation logic ──────────────────────────────────────── */
  const numericAmount  = parseInt(value, 10) || 0;
  const isExpense      = type === 'expense';

  // When editing, the original tx amount has already been deducted from wallet
  // so we add it back to get the true "available" balance for this edit session.
  const effectiveBalance = selectedWallet
    ? Number(selectedWallet.balance) + (isExpense ? editingTxCurrentAmount : 0)
    : 0;

  const hasWallet       = !!selectedWallet;
  const hasAmount       = numericAmount > 0;
  const exceedsBalance  = isExpense && hasWallet && hasAmount && numericAmount > effectiveBalance;
  const nearLimit       = isExpense && hasWallet && hasAmount
    && numericAmount > effectiveBalance * 0.8
    && !exceedsBalance;

  /* ── Colors based on state ─────────────────────────────────── */
  let borderColor = focused ? 'var(--accent-cyan)' : 'var(--border-default)';
  let shadowColor = focused ? '0 0 0 3px var(--accent-cyan-dim)' : 'none';

  if (hasAmount && hasWallet && isExpense) {
    if (exceedsBalance) {
      borderColor = 'var(--accent-rose)';
      shadowColor = '0 0 0 3px rgba(251,113,133,0.15)';
    } else if (nearLimit) {
      borderColor = 'var(--accent-amber)';
      shadowColor = '0 0 0 3px rgba(251,191,36,0.12)';
    } else if (hasAmount) {
      borderColor = focused ? 'var(--accent-cyan)' : 'var(--border-default)';
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── Input wrapper ── */}
      <div style={{ position: 'relative' }}>
        {/* Rp prefix */}
        <div style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 14, fontWeight: 600,
          color: focused ? 'var(--accent-cyan)' : 'var(--text-tertiary)',
          transition: 'color 0.2s',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 1,
        }}>
          Rp
        </div>

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9.]*"
          required={required}
          value={display}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            width: '100%',
            background: focused ? 'var(--bg-hover)' : 'var(--bg-overlay)',
            border: `1px solid ${borderColor}`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px 12px 44px',
            fontSize: 22,
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            color: exceedsBalance ? 'var(--accent-rose)' : 'var(--text-primary)',
            letterSpacing: '-0.025em',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s, color 0.2s',
            boxShadow: shadowColor,
            WebkitAppearance: 'none',
          }}
        />

        {/* Status icon on the right */}
        {hasAmount && hasWallet && isExpense && (
          <div style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center',
            pointerEvents: 'none',
          }}>
            {exceedsBalance ? (
              <AlertTriangle size={18} style={{ color: 'var(--accent-rose)' }} />
            ) : nearLimit ? (
              <AlertTriangle size={18} style={{ color: 'var(--accent-amber)' }} />
            ) : (
              <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)', opacity: 0.8 }} />
            )}
          </div>
        )}
      </div>

      {/* ── Wallet balance info + warning ── */}
      {hasWallet && isExpense && (
        <div style={{ marginTop: 8 }}>
          {/* Balance bar */}
          {hasAmount && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ height: 3, background: 'var(--bg-active)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: 99,
                  background: exceedsBalance
                    ? 'var(--grad-rose)'
                    : nearLimit
                    ? 'var(--grad-amber)'
                    : 'var(--grad-emerald)',
                  width: `${Math.min(100, (numericAmount / effectiveBalance) * 100)}%`,
                  transition: 'width 0.3s var(--ease-out), background 0.3s',
                }} />
              </div>
            </div>
          )}

          {/* Text messages */}
          {exceedsBalance ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={12} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: 'var(--accent-rose)', fontWeight: 600 }}>
                Exceeds wallet balance.{' '}
                <span style={{ fontWeight: 400, opacity: 0.85 }}>
                  Available: {effectiveBalance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                </span>
              </p>
            </div>
          ) : nearLimit ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={12} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: 'var(--accent-amber)', fontWeight: 500 }}>
                {`${Math.round((numericAmount / effectiveBalance) * 100)}% of wallet balance.`}{' '}
                <span style={{ opacity: 0.75 }}>
                  Remaining: {(effectiveBalance - numericAmount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                </span>
              </p>
            </div>
          ) : hasAmount ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={12} style={{ color: 'var(--accent-emerald)', flexShrink: 0, opacity: 0.8 }} />
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                Remaining:{' '}
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  {(effectiveBalance - numericAmount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                </span>
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Balance:{' '}
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                {effectiveBalance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}