import { useState } from "react";
import { useCreateCategory, useUpdateCategory } from "@/api/hooks";
import type { Category } from "@/types/domain";
import type { CategoryType } from "@/types/database";

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
  const errorId = "category-form-error";

  return (
    <form onSubmit={handleSubmit} aria-describedby={errorMessage ? errorId : undefined}>
      {errorMessage && (
        <div id={errorId} className="error-alert" role="alert" aria-live="assertive" style={{ marginBottom: "1rem" }}>
          {errorMessage}
        </div>
      )}
      <div className="form-field">
        <label htmlFor="category-name" className="form-label">
          이름 *
        </label>
        <input
          id="category-name"
          type="text"
          className="input-text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="카테고리 이름"
          aria-required="true"
          aria-invalid={!!errorMessage}
        />
      </div>
      <div className="form-field">
        <label htmlFor="category-type" className="form-label">
          유형 *
        </label>
        <select
          id="category-type"
          className="input-text"
          value={type}
          onChange={(e) => setType(e.target.value as CategoryType)}
          aria-required="true"
        >
          <option value="expense">지출</option>
          <option value="asset">자산</option>
          <option value="income">수입</option>
        </select>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "저장 중..." : isEdit ? "수정" : "저장"}
        </button>
      </div>
    </form>
  );
}
