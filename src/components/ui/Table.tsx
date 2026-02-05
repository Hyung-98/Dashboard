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
            {columns.map((col) => {
              const isSorted = col.sortable && sortKey === col.key;
              const ariaSort: "ascending" | "descending" | "none" | undefined = col.sortable
                ? isSorted
                  ? sortDirection === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
                : undefined;
              return (
                <th key={col.key} scope="col" aria-sort={ariaSort}>
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      className="table-sort-header"
                      onClick={() => onSort(col.key)}
                      aria-label={
                        isSorted
                          ? `${col.header} ${
                              sortDirection === "asc" ? "오름차순" : "내림차순"
                            } 정렬됨. 정렬 변경하려면 클릭`
                          : `${col.header} 정렬`
                      }
                    >
                      {col.header}
                      {isSorted && (
                        <span className="table-sort-icon" aria-hidden="true">
                          {sortDirection === "asc" ? " ↑" : " ↓"}
                        </span>
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
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
