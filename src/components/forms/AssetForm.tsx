import { useState } from "react";
import { useCategories, useCreateAsset, useUpdateAsset } from "@/api/hooks";
import { Select, type SelectOption } from "@/components/ui";
import type { AssetWithCategory } from "@/types/domain";

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
  const errorId = "asset-form-error";

  return (
    <form onSubmit={handleSubmit} aria-describedby={errorMessage ? errorId : undefined}>
      {errorMessage && (
        <div id={errorId} className="error-alert" role="alert" aria-live="assertive" style={{ marginBottom: "1rem" }}>
          {errorMessage}
        </div>
      )}
      <div className="form-field">
        <label htmlFor="asset-name" className="form-label">
          자산명 *
        </label>
        <input
          id="asset-name"
          type="text"
          className="input-text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="자산명"
          aria-required="true"
          aria-invalid={!!errorMessage}
        />
      </div>
      <div className="form-field">
        <label htmlFor="asset-amount" className="form-label">
          금액 *
        </label>
        <input
          id="asset-amount"
          type="number"
          min={0}
          className="input-number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="금액"
          aria-required="true"
          aria-invalid={!!errorMessage}
        />
      </div>
      <div className="form-field">
        <label htmlFor="asset-category" className="form-label">
          카테고리
        </label>
        <Select
          options={categoryOptions}
          value={categoryId}
          onChange={setCategoryId}
          placeholder="카테고리 선택 (선택)"
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "저장 중..." : isEdit ? "수정" : "저장"}
        </button>
      </div>
    </form>
  );
}
