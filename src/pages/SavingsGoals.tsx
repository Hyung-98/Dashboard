import { useState } from "react";
import { useSavingsGoals, useDeleteSavingsGoal } from "@/api/hooks";
import type { SavingsGoal } from "@/api/savingsGoals";
import { Table, TableSkeleton, Modal } from "@/components/ui";
import { SavingsGoalForm } from "@/components/forms";
import type { Column } from "@/components/ui";

function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function SavingsGoals() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const { data: goals = [], isLoading, isError, error } = useSavingsGoals();
  const deleteGoal = useDeleteSavingsGoal();

  const columns: Column<SavingsGoal>[] = [
    {
      key: "name",
      header: "목표 이름",
      render: (row) => row.name,
    },
    {
      key: "target_amount",
      header: "목표 금액",
      render: (row) => `${Number(row.target_amount).toLocaleString()}원`,
    },
    {
      key: "current_amount",
      header: "현재 금액",
      render: (row) => `${Number(row.current_amount).toLocaleString()}원`,
    },
    {
      key: "progress",
      header: "진행률",
      render: (row) => {
        const pct = progressPercent(Number(row.current_amount), Number(row.target_amount));
        return `${pct}%`;
      },
    },
    {
      key: "target_date",
      header: "목표일",
      render: (row) => row.target_date ?? "-",
    },
    {
      key: "actions",
      header: "작업",
      render: (row) => (
        <span onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn-edit" onClick={() => setEditingGoal(row)}>
            수정
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              if (window.confirm("이 목표를 삭제할까요?")) deleteGoal.mutate(row.id);
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
      <div className="error-alert" role="alert">
        <p>오류: {error?.message ?? "데이터를 불러오지 못했습니다."}</p>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <h1>저축 목표</h1>
        <button type="button" className="btn-primary" onClick={() => setAddModalOpen(true)}>
          목표 추가
        </button>
      </header>
      <Modal
        open={addModalOpen || editingGoal != null}
        onClose={() => {
          setAddModalOpen(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? "목표 수정" : "목표 추가"}
      >
        <SavingsGoalForm
          key={editingGoal?.id ?? "new"}
          initialData={editingGoal ?? undefined}
          onSuccess={() => {
            setAddModalOpen(false);
            setEditingGoal(null);
          }}
        />
      </Modal>
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <Table<SavingsGoal>
          columns={columns}
          data={goals}
          getRowKey={(row) => row.id}
          emptyMessage="등록된 저축 목표가 없습니다."
        />
      )}
    </div>
  );
}
