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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered =
    searchable && search.trim()
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options;

  useEffect(() => {
    if (!open) {
      setSearch("");
      setHighlightedIndex(-1);
    }
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setOpen(false);
        (containerRef.current?.querySelector("button") as HTMLElement)?.focus();
        return;
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
        return;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
        return;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
          const opt = filtered[highlightedIndex];
          if (isMultiple) {
            const selected = (props.value as T[]).includes(opt.value);
            const next = selected
              ? (props.value as T[]).filter((x) => x !== opt.value)
              : [...(props.value as T[]), opt.value];
            (props as SelectMultipleProps<T>).onChange(next);
          } else {
            (props as SelectProps<T>).onChange(opt.value);
            setOpen(false);
          }
        }
        return;
      default:
        break;
    }
  };

  useEffect(() => {
    if (open && highlightedIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-option-index="${highlightedIndex}"]`);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [open, highlightedIndex]);

  const listboxId = "select-listbox-" + Math.random().toString(36).slice(2, 9);

  return (
    <div
      ref={containerRef}
      className="select-wrap"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={displayValue ? `${placeholder}: ${displayValue}` : placeholder}
      >
        <span className={displayValue ? "" : "select-placeholder"}>
          {displayValue || placeholder}
        </span>
        <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="select-dropdown"
          aria-multiselectable={isMultiple || undefined}
          tabIndex={-1}
        >
          {searchable && (
            <input
              type="text"
              className="select-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색..."
              aria-label="옵션 검색"
              onKeyDown={(e) => e.stopPropagation()}
            />
          )}
          {filtered.map((opt, idx) => {
            const selected = isMultiple
              ? (props.value as T[]).includes(opt.value)
              : (props.value as T | null) === opt.value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={selected}
                data-option-index={idx}
                className="select-option"
                style={{
                  background: highlightedIndex === idx ? "var(--color-bg-secondary)" : undefined,
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
                onMouseEnter={() => setHighlightedIndex(idx)}
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
