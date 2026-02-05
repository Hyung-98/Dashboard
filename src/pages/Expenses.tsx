import { useState, useMemo } from "react";
import { useExpenseFilters } from "@/hooks/useExpenseFilters";
import { useExpenses, useCategories, useDeleteExpense } from "@/api/hooks";
import type { SelectOption } from "@/components/ui";
import { Table, Select, DateRangePicker, TableSkeleton, Modal } from "@/components/ui";
import { ExpenseForm } from "@/components/forms";
import type { Column } from "@/components/ui";
import type { ExpenseWithCategory } from "@/types/domain";

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
          <button type="button" className="btn-edit" onClick={() => setEditingExpense(row)}>
            수정
          </button>
          <button
            type="button"
            className="btn-danger"
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
      <div className="error-alert" role="alert">
        <p>오류: {error?.message ?? "데이터를 불러오지 못했습니다."}</p>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <h1>지출 목록</h1>
        <button type="button" className="btn-primary" onClick={() => setAddModalOpen(true)}>
          지출 추가
        </button>
      </header>
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
      <div className="filter-row">
        <DateRangePicker from={filters.from} to={filters.to} onChange={handleDateChange} />
        <Select
          options={categoryOptions}
          value={filters.categoryId}
          onChange={handleCategoryChange}
          placeholder="카테고리"
        />
        <div className="filter-group">
          <input
            type="number"
            className="input-number filter-input"
            placeholder="최소 금액"
            value={filters.minAmount ?? ""}
            onChange={handleMinAmount}
            aria-label="최소 금액"
          />
          <span className="date-range-sep" aria-hidden="true">~</span>
          <input
            type="number"
            className="input-number filter-input"
            placeholder="최대 금액"
            value={filters.maxAmount ?? ""}
            onChange={handleMaxAmount}
            aria-label="최대 금액"
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
