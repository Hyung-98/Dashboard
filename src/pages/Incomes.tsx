import { useState, useMemo } from "react";
import { useIncomeFilters } from "@/hooks/useIncomeFilters";
import { useIncomes, useCategories, useDeleteIncome } from "@/api/hooks";
import type { SelectOption } from "@/components/ui";
import { Table, Select, DateRangePicker, TableSkeleton, Modal } from "@/components/ui";
import { IncomeForm } from "@/components/forms";
import type { Column } from "@/components/ui";
import type { IncomeWithCategory } from "@/types/domain";

export function Incomes() {
  const [filters, setFilters] = useIncomeFilters();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeWithCategory | null>(null);
  const [sortKey, setSortKey] = useState<string | null>("occurred_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { data: incomes = [], isLoading, isError, error } = useIncomes(filters);
  const { data: categories = [] } = useCategories();
  const deleteIncome = useDeleteIncome();

  const columns: Column<IncomeWithCategory>[] = [
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
          <button type="button" className="btn-edit" onClick={() => setEditingIncome(row)}>
            수정
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              if (window.confirm("이 수입을 삭제할까요?")) deleteIncome.mutate(row.id);
            }}
          >
            삭제
          </button>
        </span>
      ),
    },
  ];

  const categoryOptions: SelectOption[] = categories
    .filter((c) => c.type === "income")
    .map((c) => ({ value: c.id, label: c.name }));

  const sortedIncomes = useMemo(() => {
    if (!sortKey) return incomes;
    const sorted = [...incomes].sort((a, b) => {
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
  }, [incomes, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
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
        <h1>수입 목록</h1>
        <button type="button" className="btn-primary" onClick={() => setAddModalOpen(true)}>
          수입 추가
        </button>
      </header>
      <Modal
        open={addModalOpen || editingIncome != null}
        onClose={() => {
          setAddModalOpen(false);
          setEditingIncome(null);
        }}
        title={editingIncome ? "수입 수정" : "수입 추가"}
      >
        <IncomeForm
          key={editingIncome?.id ?? "new"}
          initialData={editingIncome ?? undefined}
          onSuccess={() => {
            setAddModalOpen(false);
            setEditingIncome(null);
          }}
        />
      </Modal>
      <div className="filter-row">
        <DateRangePicker from={filters.from} to={filters.to} onChange={(from, to) => setFilters({ from, to })} />
        <Select
          options={categoryOptions}
          value={filters.categoryId}
          onChange={(value) => setFilters({ categoryId: value })}
          placeholder="카테고리"
        />
        <div className="filter-group">
          <input
            type="number"
            className="input-number filter-input"
            placeholder="최소 금액"
            value={filters.minAmount ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setFilters({ minAmount: v === "" ? null : Number(v) });
            }}
            aria-label="최소 금액"
          />
          <span className="date-range-sep" aria-hidden="true">~</span>
          <input
            type="number"
            className="input-number filter-input"
            placeholder="최대 금액"
            value={filters.maxAmount ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setFilters({ maxAmount: v === "" ? null : Number(v) });
            }}
            aria-label="최대 금액"
          />
        </div>
      </div>
      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <Table<IncomeWithCategory>
          columns={columns}
          data={sortedIncomes}
          getRowKey={(row) => row.id}
          emptyMessage="조건에 맞는 수입이 없습니다."
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}
    </div>
  );
}
