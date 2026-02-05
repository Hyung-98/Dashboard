import type { ChangeEvent } from "react";

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  disabled?: boolean;
}

export function DateRangePicker({ from, to, onChange, disabled = false }: DateRangePickerProps) {
  const handleFrom = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, to);
  };
  const handleTo = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(from, e.target.value);
  };
  return (
    <div className="date-range-picker" role="group" aria-label="날짜 범위">
      <input
        type="date"
        id="date-range-from"
        value={from}
        onChange={handleFrom}
        disabled={disabled}
        aria-label="시작일"
      />
      <span className="date-range-sep" aria-hidden="true">
        ~
      </span>
      <input
        type="date"
        id="date-range-to"
        value={to}
        onChange={handleTo}
        disabled={disabled}
        aria-label="종료일"
      />
    </div>
  );
}
