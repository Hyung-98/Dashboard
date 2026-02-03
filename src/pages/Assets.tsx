import { useState } from "react";
import { useAssets, useDeleteAsset } from "@/api/hooks";
import { Table, TableSkeleton, Modal } from "@/components/ui";
import { AssetForm } from "@/components/forms";
import type { Column } from "@/components/ui";
import type { AssetWithCategory } from "@/types/domain";

const buttonStyle = {
  padding: "0.25rem 0.5rem",
  fontSize: "0.75rem",
  border: "none",
  borderRadius: 4,
  cursor: "pointer" as const,
  marginRight: 4,
};

export function Assets() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetWithCategory | null>(null);
  const { data: assets = [], isLoading, isError, error } = useAssets();
  const deleteAsset = useDeleteAsset();

  const columns: Column<AssetWithCategory>[] = [
    {
      key: "name",
      header: "자산명",
      render: (row) => row.name,
    },
    {
      key: "category",
      header: "카테고리",
      render: (row) => row.categories?.name ?? "-",
    },
    {
      key: "amount",
      header: "금액",
      render: (row) => row.amount.toLocaleString() + "원",
    },
    {
      key: "updated_at",
      header: "갱신일",
      render: (row) => row.updated_at,
    },
    {
      key: "actions",
      header: "작업",
      render: (row) => (
        <span onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            style={{ ...buttonStyle, background: "#e2e8f0", color: "#0f172a" }}
            onClick={() => setEditingAsset(row)}
          >
            수정
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, background: "#fef2f2", color: "#dc2626" }}
            onClick={() => {
              if (window.confirm("이 자산을 삭제할까요?")) deleteAsset.mutate(row.id);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>자산 현황</h1>
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
          자산 추가
        </button>
      </div>
      <Modal
        open={addModalOpen || editingAsset != null}
        onClose={() => {
          setAddModalOpen(false);
          setEditingAsset(null);
        }}
        title={editingAsset ? "자산 수정" : "자산 추가"}
      >
        <AssetForm
          key={editingAsset?.id ?? "new"}
          initialData={editingAsset ?? undefined}
          onSuccess={() => {
            setAddModalOpen(false);
            setEditingAsset(null);
          }}
        />
      </Modal>
      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <Table<AssetWithCategory>
          columns={columns}
          data={assets}
          getRowKey={(row) => row.id}
          emptyMessage="등록된 자산이 없습니다."
        />
      )}
    </div>
  );
}
