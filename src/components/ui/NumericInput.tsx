'use client';

import { useRef, useState } from 'react';

interface NumericInputProps {
  value: string;                  // raw string value (e.g. "1500000")
  onChange: (raw: string) => void; // called with unformatted numeric string
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  id?: string;
}

/**
 * NumericInput — formats a number with "." as thousand separator (IDR style)
 * while storing the raw value for form submission.
 */
export default function NumericInput({
  value,
  onChange,
  placeholder = '0',
  style,
  className = 'input-base',
  disabled,
  id,
}: NumericInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Format raw number to IDR thousand-separated display
  const formatDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    return parseInt(digits, 10).toLocaleString('id-ID');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw);
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      className={className}
      value={formatDisplay(value)}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      style={style}
    />
  );
}
