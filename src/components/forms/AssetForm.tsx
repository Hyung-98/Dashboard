import { useState } from "react";
import { useCategories, useCreateAsset, useUpdateAsset } from "@/api/hooks";
import { Select, type SelectOption } from "@/components/ui";
import type { AssetWithCategory } from "@/types/domain";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: "0.875rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.25rem",
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "#374151",
};

const fieldStyle: React.CSSProperties = {
  marginBottom: "1rem",
};

export interface AssetFormProps {
  initialData?: AssetWithCategory | null;
  onSuccess?: () => void;
}

export function AssetForm({ initialData, onSuccess }: AssetFormProps) {
  const isEdit = Boolean(initialData?.id);
  const [name, setName] = useState<string>(initialData?.name ?? "");
  const [amount, setAmount] = useState<string>(initialData?.amount != null ? String(initialData.amount) : "");
  const [categoryId, setCategoryId] = useState<string | null>(initialData?.category_id ?? null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();

  const assetCategories = categories.filter((c) => c.type === "asset");
  const categoryOptions: SelectOption[] = assetCategories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const amountNum = Number(amount);
    if (!name.trim()) {
      setValidationError("자산명을 입력하세요.");
      return;
    }
    if (!amount.trim() || Number.isNaN(amountNum) || amountNum < 0) {
      setValidationError("금액을 0 이상의 숫자로 입력하세요.");
      return;
    }

    try {
      if (isEdit && initialData?.id) {
        await updateAsset.mutateAsync({
          id: initialData.id,
          payload: {
            name: name.trim(),
            amount: amountNum,
            category_id: categoryId || null,
          },
        });
      } else {
        await createAsset.mutateAsync({
          name: name.trim(),
          amount: amountNum,
          category_id: categoryId || null,
        });
      }
      onSuccess?.();
    } catch {
      // Error is available on createAsset.error / updateAsset.error
    }
  };

  const errorMessage =
    validationError ??
    (createAsset.error as Error | null)?.message ??
    (updateAsset.error as Error | null)?.message ??
    null;
  const isPending = createAsset.isPending || updateAsset.isPending;

  return (
    <form onSubmit={handleSubmit}>
      {errorMessage && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem",
            background: "#fef2f2",
            color: "#dc2626",
            borderRadius: 6,
            fontSize: "0.875rem",
          }}
        >
          {errorMessage}
        </div>
      )}
      <div style={fieldStyle}>
        <label style={labelStyle}>자산명 *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="자산명"
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>금액 *</label>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="금액"
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>카테고리</label>
        <Select
          options={categoryOptions}
          value={categoryId}
          onChange={setCategoryId}
          placeholder="카테고리 선택 (선택)"
        />
      </div>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "0.5rem 1rem",
            background: "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: "0.875rem",
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "저장 중..." : isEdit ? "수정" : "저장"}
        </button>
      </div>
    </form>
  );
}
