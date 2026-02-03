import { useState, useMemo } from "react";
import { useExpenseFilters } from "@/hooks/useExpenseFilters";
import { useExpenses, useCategories, useDeleteExpense } from "@/api/hooks";
import type { SelectOption } from "@/components/ui";
import { Table, Select, DateRangePicker, TableSkeleton, Modal } from "@/components/ui";
import { ExpenseForm } from "@/components/forms";
import type { Column } from "@/components/ui";
import type { ExpenseWithCategory } from "@/types/domain";

const buttonStyle = {
  padding: "0.25rem 0.5rem",
  fontSize: "0.75rem",
  border: "none",
  borderRadius: 4,
  cursor: "pointer" as const,
  marginRight: 4,
};

export function Expenses() {
  const [filters, setFilters] = useExpenseFilters();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | null>(null);
  const [sortKey, setSortKey] = useState<string | null>("occurred_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { data: expenses = [], isLoading, isError, error } = useExpenses(filters);
  const { data: categories = [] } = useCategories();
  const deleteExpense = useDeleteExpense();

  const sortedExpenses = useMemo(() => {
    if (!sortKey) return expenses;
    const sorted = [...expenses].sort((a, b) => {
      let aVal: string | number = (a as unknown as Record<string, unknown>)[sortKey] as string | number;
      let bVal: string | number = (b as unknown as Record<string, unknown>)[sortKey] as string | number;
      if (sortKey === "category") {
        aVal = a.categories?.name ?? "";
        bVal = b.categories?.name ?? "";
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal ?? "");
      const bStr = String(bVal ?? "");
      return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return sorted;
  }, [expenses, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const columns: Column<ExpenseWithCategory>[] = [
    {
      key: "occurred_at",
      header: "날짜",
      sortable: true,
      render: (row) => row.occurred_at,
    },
    {
      key: "category",
      header: "카테고리",
      render: (row) => row.categories?.name ?? "-",
    },
    {
      key: "amount",
      header: "금액",
      sortable: true,
      render: (row) => row.amount.toLocaleString() + "원",
    },
    {
      key: "memo",
      header: "메모",
      render: (row) => row.memo ?? "-",
    },
    {
      key: "actions",
      header: "작업",
      render: (row) => (
        <span onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            style={{ ...buttonStyle, background: "#e2e8f0", color: "#0f172a" }}
            onClick={() => setEditingExpense(row)}
          >
            수정
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, background: "#fef2f2", color: "#dc2626" }}
            onClick={() => {
              if (window.confirm("이 지출을 삭제할까요?")) deleteExpense.mutate(row.id);
            }}
          >
            삭제
          </button>
        </span>
      ),
    },
  ];

  const categoryOptions: SelectOption[] = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const handleCategoryChange = (value: string | null) => {
    setFilters({ categoryId: value });
  };

  const handleDateChange = (from: string, to: string) => {
    setFilters({ from, to });
  };

  const handleMinAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFilters({
      minAmount: v === "" ? null : Number(v),
    });
  };

  const handleMaxAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFilters({
      maxAmount: v === "" ? null : Number(v),
    });
  };

  if (isError) {
    return (
      <div style={{ padding: "1rem", color: "#dc2626" }}>
        <p>오류: {error?.message ?? "데이터를 불러오지 못했습니다."}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>지출 목록</h1>
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
          지출 추가
        </button>
      </div>
      <Modal
        open={addModalOpen || editingExpense != null}
        onClose={() => {
          setAddModalOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? "지출 수정" : "지출 추가"}
      >
        <ExpenseForm
          key={editingExpense?.id ?? "new"}
          initialData={editingExpense ?? undefined}
          onSuccess={() => {
            setAddModalOpen(false);
            setEditingExpense(null);
          }}
        />
      </Modal>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "flex-end",
          marginBottom: "1.5rem",
        }}
      >
        <DateRangePicker from={filters.from} to={filters.to} onChange={handleDateChange} />
        <Select
          options={categoryOptions}
          value={filters.categoryId}
          onChange={handleCategoryChange}
          placeholder="카테고리"
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="number"
            placeholder="최소 금액"
            value={filters.minAmount ?? ""}
            onChange={handleMinAmount}
            style={{
              width: 120,
              padding: "0.5rem 0.75rem",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: "0.875rem",
            }}
          />
          <span style={{ color: "#64748b" }}>~</span>
          <input
            type="number"
            placeholder="최대 금액"
            value={filters.maxAmount ?? ""}
            onChange={handleMaxAmount}
            style={{
              width: 120,
              padding: "0.5rem 0.75rem",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: "0.875rem",
            }}
          />
        </div>
      </div>
      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <Table<ExpenseWithCategory>
          columns={columns}
          data={sortedExpenses}
          getRowKey={(row) => row.id}
          emptyMessage="조건에 맞는 지출이 없습니다."
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}
    </div>
  );
}
