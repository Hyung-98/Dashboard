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
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="date"
        value={from}
        onChange={handleFrom}
        disabled={disabled}
        style={{
          padding: "0.5rem 0.75rem",
          border: "1px solid #e2e8f0",
          borderRadius: 6,
          fontSize: "0.875rem",
        }}
      />
      <span style={{ color: "#64748b" }}>~</span>
      <input
        type="date"
        value={to}
        onChange={handleTo}
        disabled={disabled}
        style={{
          padding: "0.5rem 0.75rem",
          border: "1px solid #e2e8f0",
          borderRadius: 6,
          fontSize: "0.875rem",
        }}
      />
    </div>
  );
}
