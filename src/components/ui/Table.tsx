import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (key: string) => void;
  sortKey?: string | null;
  sortDirection?: "asc" | "desc";
  onRowClick?: (row: T) => void;
  getRowKey: (row: T) => string;
}

export function Table<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "데이터가 없습니다.",
  onSort,
  sortKey = null,
  sortDirection = "asc",
  onRowClick,
  getRowKey,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="table-wrap" style={{ padding: "1rem", color: "var(--color-text-secondary)" }}>
        로딩 중...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="table-wrap"
        style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary)" }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table-theme">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ cursor: col.sortable ? "pointer" : "default" }}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                {col.header}
                {col.sortable && sortKey === col.key && (
                  <span style={{ marginLeft: 4 }}>{sortDirection === "asc" ? " ↑" : " ↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={getRowKey(row)}
              style={{ cursor: onRowClick ? "pointer" : "default" }}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
