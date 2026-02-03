import { useState, useMemo } from "react";
import { useBudgets, useExpenses, useDeleteBudget } from "@/api/hooks";
import { Table, TableSkeleton, Modal } from "@/components/ui";
import { BudgetForm } from "@/components/forms";
import type { Column } from "@/components/ui";
import type { BudgetWithCategory } from "@/types/domain";
import { DEFAULT_EXPENSE_FILTERS } from "@/types/filters";

const buttonStyle = {
  padding: "0.25rem 0.5rem",
  fontSize: "0.75rem",
  border: "none",
  borderRadius: 4,
  cursor: "pointer" as const,
  marginRight: 4,
};

type BudgetRow = BudgetWithCategory & { spent: number; remaining: number; usagePercent: number };

function isExpenseInBudgetPeriod(occurredAt: string, periodStart: string, period: "monthly" | "yearly"): boolean {
  if (period === "monthly") {
    return occurredAt.slice(0, 7) === periodStart.slice(0, 7);
  }
  return occurredAt.slice(0, 4) === periodStart.slice(0, 4);
}

export function Budgets() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithCategory | null>(null);
  const { data: budgets = [], isLoading, isError, error } = useBudgets();
  const deleteBudget = useDeleteBudget();
  const expenseFilters = useMemo(
    () => ({
      ...DEFAULT_EXPENSE_FILTERS,
      from: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
    }),
    []
  );
  const { data: expenses = [] } = useExpenses(expenseFilters);

  const budgetsWithSpent: BudgetRow[] = useMemo(() => {
    return budgets.map((b) => {
      const spent = expenses
        .filter((e) => e.budget_id === b.id && isExpenseInBudgetPeriod(e.occurred_at, b.period_start, b.period))
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const remaining = Math.max(0, Number(b.amount) - spent);
      const usagePercent = Number(b.amount) > 0 ? (spent / Number(b.amount)) * 100 : 0;
      return { ...b, spent, remaining, usagePercent };
    });
  }, [budgets, expenses]);

  const columns: Column<BudgetRow>[] = [
    {
      key: "period_start",
      header: "기간 시작",
      render: (row) => row.period_start,
    },
    {
      key: "category",
      header: "카테고리",
      render: (row) => row.categories?.name ?? "-",
    },
    {
      key: "period",
      header: "주기",
      render: (row) => (row.period === "monthly" ? "월" : "년"),
    },
    {
      key: "amount",
      header: "예산 금액",
      render: (row) => row.amount.toLocaleString() + "원",
    },
    {
      key: "spent",
      header: "사용액",
      render: (row) => row.spent.toLocaleString() + "원",
    },
    {
      key: "remaining",
      header: "잔여",
      render: (row) => (
        <span style={{ color: row.remaining >= 0 ? undefined : "#dc2626" }}>{row.remaining.toLocaleString()}원</span>
      ),
    },
    {
      key: "usagePercent",
      header: "사용률",
      render: (row) => (
        <span style={{ color: row.usagePercent > 100 ? "#dc2626" : row.usagePercent > 80 ? "#f59e0b" : undefined }}>
          {row.usagePercent.toFixed(0)}%
        </span>
      ),
    },
    {
      key: "actions",
      header: "작업",
      render: (row) => (
        <span onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            style={{ ...buttonStyle, background: "#e2e8f0", color: "#0f172a" }}
            onClick={() => setEditingBudget(row)}
          >
            수정
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, background: "#fef2f2", color: "#dc2626" }}
            onClick={() => {
              if (window.confirm("이 예산을 삭제할까요?")) deleteBudget.mutate(row.id);
            }}
          >
            삭제
          </button>
        </span>
      ),
    },
  ];

  if (isError) {
    return (
      <div style={{ padding: "1rem", color: "#dc2626" }}>
        <p>오류: {error?.message ?? "데이터를 불러오지 못했습니다."}</p>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <h1>예산</h1>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          style={{
            padding: "0.5rem 1rem",
            background: "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          예산 추가
        </button>
      </header>
      <Modal
        open={addModalOpen || editingBudget != null}
        onClose={() => {
          setAddModalOpen(false);
          setEditingBudget(null);
        }}
        title={editingBudget ? "예산 수정" : "예산 추가"}
      >
        <BudgetForm
          key={editingBudget?.id ?? "new"}
          initialData={editingBudget ?? undefined}
          onSuccess={() => {
            setAddModalOpen(false);
            setEditingBudget(null);
          }}
        />
      </Modal>
      {isLoading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : (
        <Table<BudgetRow>
          columns={columns}
          data={budgetsWithSpent}
          getRowKey={(row) => row.id}
          emptyMessage="등록된 예산이 없습니다."
        />
      )}
    </div>
  );
}
