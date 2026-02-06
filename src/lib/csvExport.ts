/**
 * Escapes a CSV cell (wraps in quotes if contains comma, quote, or newline).
 */
function escapeCsvCell(value: string): string {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts expense rows to CSV and triggers download.
 */
export function downloadExpensesCsv(
  rows: Array<{ occurred_at: string; amount: number; memo: string | null; categories?: { name: string } | null }>,
  filenamePrefix = "expenses"
): void {
  const headers = ["날짜", "카테고리", "금액", "메모"];
  const lines = rows.map((row) => {
    const date = row.occurred_at;
    const category = row.categories?.name ?? "";
    const amount = String(row.amount);
    const memo = row.memo ?? "";
    return [date, category, amount, memo].map(escapeCsvCell).join(",");
  });
  const csv = [headers.join(","), ...lines].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Converts income rows to CSV and triggers download.
 */
export function downloadIncomesCsv(
  rows: Array<{ occurred_at: string; amount: number; memo: string | null; categories?: { name: string } | null }>,
  filenamePrefix = "incomes"
): void {
  const headers = ["날짜", "카테고리", "금액", "메모"];
  const lines = rows.map((row) => {
    const date = row.occurred_at;
    const category = row.categories?.name ?? "";
    const amount = String(row.amount);
    const memo = row.memo ?? "";
    return [date, category, amount, memo].map(escapeCsvCell).join(",");
  });
  const csv = [headers.join(","), ...lines].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
