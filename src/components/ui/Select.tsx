import { useState, useRef, useEffect, type ReactNode } from "react";

export interface SelectOption<T = string> {
  value: T;
  label: string;
}

interface SelectProps<T = string> {
  options: SelectOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  placeholder?: string;
  disabled?: boolean;
  multiple?: false;
  searchable?: boolean;
  renderOption?: (option: SelectOption<T>) => ReactNode;
}

interface SelectMultipleProps<T = string> {
  options: SelectOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  placeholder?: string;
  disabled?: boolean;
  multiple: true;
  searchable?: boolean;
  renderOption?: (option: SelectOption<T>) => ReactNode;
}

export function Select<T = string>(props: SelectProps<T> | SelectMultipleProps<T>) {
  const { options, placeholder = "선택", disabled = false, searchable = false, renderOption } = props;
  const isMultiple = props.multiple === true;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered =
    searchable && search.trim() ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())) : options;

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const valueLabel = (v: T) => options.find((o) => o.value === v)?.label ?? String(v);
  const displayValue = isMultiple
    ? (props.value as T[]).length
      ? (props.value as T[]).map(valueLabel).join(", ")
      : ""
    : props.value != null
    ? valueLabel(props.value as T)
    : "";

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block", minWidth: 160 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "0.5rem 0.75rem",
          border: "1px solid #e2e8f0",
          borderRadius: 6,
          background: "#fff",
          textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
          color: displayValue ? "#0f172a" : "#94a3b8",
          fontSize: "0.875rem",
        }}
      >
        {displayValue || placeholder}
        <span style={{ float: "right", marginLeft: 8 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            zIndex: 50,
            maxHeight: 240,
            overflow: "auto",
          }}
        >
          {searchable && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색..."
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                border: "none",
                borderBottom: "1px solid #e2e8f0",
                outline: "none",
                fontSize: "0.875rem",
              }}
            />
          )}
          {filtered.map((opt) => {
            const selected = isMultiple
              ? (props.value as T[]).includes(opt.value)
              : (props.value as T | null) === opt.value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  border: "none",
                  background: selected ? "#f1f5f9" : "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
                onClick={() => {
                  if (isMultiple) {
                    const next = selected
                      ? (props.value as T[]).filter((x) => x !== opt.value)
                      : [...(props.value as T[]), opt.value];
                    (props as SelectMultipleProps<T>).onChange(next);
                  } else {
                    (props as SelectProps<T>).onChange(opt.value);
                    setOpen(false);
                  }
                }}
              >
                {renderOption ? renderOption(opt) : opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
