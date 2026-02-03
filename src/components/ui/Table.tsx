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
    return <div style={{ padding: "1rem", color: "#64748b" }}>로딩 중...</div>;
  }

  if (data.length === 0) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>{emptyMessage}</div>;
  }

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        background: "#fff",
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <thead>
        <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
          {columns.map((col) => (
            <th
              key={col.key}
              style={{
                padding: "0.75rem 1rem",
                textAlign: "left",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: col.sortable ? "pointer" : "default",
              }}
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
            style={{
              borderBottom: "1px solid #f1f5f9",
              cursor: onRowClick ? "pointer" : "default",
            }}
            onClick={() => onRowClick?.(row)}
          >
            {columns.map((col) => (
              <td key={col.key} style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}>
                {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
