import { useMemo, useState } from "react";
import { useExpenses, useIncomes } from "@/api/hooks";
import { DateRangePicker } from "@/components/ui";
import { DEFAULT_EXPENSE_FILTERS, DEFAULT_INCOME_FILTERS } from "@/types/filters";

export function Report() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const expenseFilters = useMemo(
    () => ({ ...DEFAULT_EXPENSE_FILTERS, from, to }),
    [from, to]
  );
  const incomeFilters = useMemo(
    () => ({ ...DEFAULT_INCOME_FILTERS, from, to }),
    [from, to]
  );
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(expenseFilters);
  const { data: incomes = [], isLoading: incomesLoading } = useIncomes(incomeFilters);

  const totalExpense = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses]
  );
  const totalIncome = useMemo(
    () => incomes.reduce((sum, i) => sum + Number(i.amount), 0),
    [incomes]
  );
  const netAmount = totalIncome - totalExpense;

  const expenseByCategory = useMemo(() => {
    const byCat: Record<string, number> = {};
    expenses.forEach((e) => {
      const name = e.categories?.name ?? "기타";
      byCat[name] = (byCat[name] ?? 0) + Number(e.amount);
    });
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const incomeByCategory = useMemo(() => {
    const byCat: Record<string, number> = {};
    incomes.forEach((i) => {
      const name = i.categories?.name ?? "기타";
      byCat[name] = (byCat[name] ?? 0) + Number(i.amount);
    });
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [incomes]);

  const handlePrint = () => {
    window.print();
  };

  const isLoading = expensesLoading || incomesLoading;

  return (
    <div className="report-page">
      <header className="page-header">
        <h1>리포트</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>기간</span>
            <DateRangePicker
              from={from}
              to={to}
              onChange={(f, t) => {
                setFrom(f);
                setTo(t);
              }}
            />
          </div>
          <button type="button" className="btn-primary no-print" onClick={handlePrint}>
            인쇄 / PDF 저장
          </button>
        </div>
      </header>

      <div className="report-content">
        <h2 className="report-title">기간 요약 ({from} ~ {to})</h2>
        {isLoading ? (
          <p>로딩 중...</p>
        ) : (
          <>
            <section className="report-summary">
              <h3>요약</h3>
              <table className="report-table">
                <tbody>
                  <tr>
                    <td>총 지출</td>
                    <td>{totalExpense.toLocaleString()}원</td>
                  </tr>
                  <tr>
                    <td>총 수입</td>
                    <td>{totalIncome.toLocaleString()}원</td>
                  </tr>
                  <tr>
                    <td>순이익 (수입 - 지출)</td>
                    <td style={{ color: netAmount >= 0 ? "var(--color-trend-up)" : "var(--color-trend-down)" }}>
                      {netAmount >= 0 ? "" : "-"}
                      {Math.abs(netAmount).toLocaleString()}원
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="report-section">
              <h3>지출 카테고리별</h3>
              {expenseByCategory.length === 0 ? (
                <p>데이터 없음</p>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>카테고리</th>
                      <th>금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseByCategory.map(({ name, value }) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{value.toLocaleString()}원</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="report-section">
              <h3>수입 카테고리별</h3>
              {incomeByCategory.length === 0 ? (
                <p>데이터 없음</p>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>카테고리</th>
                      <th>금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeByCategory.map(({ name, value }) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{value.toLocaleString()}원</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
