import { useState } from "react";
import { useCreateCategory, useUpdateCategory } from "@/api/hooks";
import type { Category } from "@/types/domain";
import type { CategoryType } from "@/types/database";

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

export interface CategoryFormProps {
  initialData?: Category | null;
  onSuccess?: () => void;
}

export function CategoryForm({ initialData, onSuccess }: CategoryFormProps) {
  const isEdit = Boolean(initialData?.id);
  const [name, setName] = useState<string>(initialData?.name ?? "");
  const [type, setType] = useState<CategoryType>(initialData?.type ?? "expense");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError("이름을 입력하세요.");
      return;
    }

    try {
      if (isEdit && initialData?.id) {
        await updateCategoryMutation.mutateAsync({
          id: initialData.id,
          payload: { name: name.trim(), type },
        });
      } else {
        await createCategoryMutation.mutateAsync({
          name: name.trim(),
          type,
        });
      }
      onSuccess?.();
    } catch {
      // Error is available on mutation.error
    }
  };

  const errorMessage =
    validationError ??
    (createCategoryMutation.error as Error | null)?.message ??
    (updateCategoryMutation.error as Error | null)?.message ??
    null;
  const isPending = createCategoryMutation.isPending || updateCategoryMutation.isPending;

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
        <label style={labelStyle}>이름 *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="카테고리 이름"
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>유형 *</label>
        <select value={type} onChange={(e) => setType(e.target.value as CategoryType)} style={inputStyle}>
          <option value="expense">지출</option>
          <option value="asset">자산</option>
          <option value="income">수입</option>
        </select>
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
