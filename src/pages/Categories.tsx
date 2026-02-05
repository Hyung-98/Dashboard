import { useState } from "react";
import { useCategories, useDeleteCategory } from "@/api/hooks";
import { Table, TableSkeleton, Modal } from "@/components/ui";
import { CategoryForm } from "@/components/forms";
import type { Column } from "@/components/ui";
import type { Category } from "@/types/domain";

const typeLabels: Record<string, string> = {
  expense: "지출",
  asset: "자산",
  income: "수입",
};

export function Categories() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { data: categories = [], isLoading, isError, error } = useCategories();
  const deleteCategory = useDeleteCategory();

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "이름",
      render: (row) => row.name,
    },
    {
      key: "type",
      header: "유형",
      render: (row) => typeLabels[row.type] ?? row.type,
    },
    {
      key: "actions",
      header: "작업",
      render: (row) => (
        <span onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn-edit" onClick={() => setEditingCategory(row)}>
            수정
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              if (window.confirm("이 카테고리를 삭제할까요? 연결된 지출/예산/자산에 영향을 줄 수 있습니다."))
                deleteCategory.mutate(row.id);
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
        <h1>카테고리 관리</h1>
        <button type="button" className="btn-primary" onClick={() => setAddModalOpen(true)}>
          카테고리 추가
        </button>
      </header>
      <Modal
        open={addModalOpen || editingCategory != null}
        onClose={() => {
          setAddModalOpen(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? "카테고리 수정" : "카테고리 추가"}
      >
        <CategoryForm
          key={editingCategory?.id ?? "new"}
          initialData={editingCategory ?? undefined}
          onSuccess={() => {
            setAddModalOpen(false);
            setEditingCategory(null);
          }}
        />
      </Modal>
      {isLoading ? (
        <TableSkeleton rows={6} cols={3} />
      ) : (
        <Table<Category>
          columns={columns}
          data={categories}
          getRowKey={(row) => row.id}
          emptyMessage="등록된 카테고리가 없습니다. 추가 버튼 또는 시드로 기본 카테고리를 넣을 수 있습니다."
        />
      )}
    </div>
  );
}
