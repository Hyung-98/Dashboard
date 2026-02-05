import { useState } from "react";
import { useCategories, useCreateIncome, useUpdateIncome } from "@/api/hooks";
import { Select, type SelectOption } from "@/components/ui";
import type { IncomeWithCategory } from "@/types/domain";

export interface IncomeFormProps {
  initialData?: IncomeWithCategory | null;
  onSuccess?: () => void;
}

export function IncomeForm({ initialData, onSuccess }: IncomeFormProps) {
  const isEdit = Boolean(initialData?.id);
  const [categoryId, setCategoryId] = useState<string | null>(initialData?.category_id ?? null);
  const [amount, setAmount] = useState<string>(initialData?.amount != null ? String(initialData.amount) : "");
  const [occurredAt, setOccurredAt] = useState<string>(initialData?.occurred_at ?? "");
  const [memo, setMemo] = useState<string>(initialData?.memo ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();

  const incomeCategories = categories.filter((c) => c.type === "income");
  const categoryOptions: SelectOption[] = incomeCategories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const amountNum = Number(amount);
    if (!categoryId) {
      setValidationError("카테고리를 선택하세요.");
      return;
    }
    if (!amount.trim() || Number.isNaN(amountNum) || amountNum <= 0) {
      setValidationError("금액을 0보다 큰 숫자로 입력하세요.");
      return;
    }
    if (!occurredAt.trim()) {
      setValidationError("발생일을 입력하세요.");
      return;
    }

    try {
      if (isEdit && initialData?.id) {
        await updateIncome.mutateAsync({
          id: initialData.id,
          payload: {
            category_id: categoryId,
            amount: amountNum,
            occurred_at: occurredAt,
            memo: memo.trim() || null,
          },
        });
      } else {
        await createIncome.mutateAsync({
          category_id: categoryId,
          amount: amountNum,
          occurred_at: occurredAt,
          memo: memo.trim() || null,
        });
      }
      onSuccess?.();
    } catch {
      // Error is available on mutation.error
    }
  };

  const errorMessage =
    validationError ??
    (createIncome.error as Error | null)?.message ??
    (updateIncome.error as Error | null)?.message ??
    null;
  const isPending = createIncome.isPending || updateIncome.isPending;
  const errorId = "income-form-error";

  return (
    <form onSubmit={handleSubmit} aria-describedby={errorMessage ? errorId : undefined}>
      {errorMessage && (
        <div id={errorId} className="error-alert" role="alert" aria-live="assertive" style={{ marginBottom: "1rem" }}>
          {errorMessage}
        </div>
      )}
      <div className="form-field">
        <label htmlFor="income-category" className="form-label">
          카테고리 *
        </label>
        <Select
          options={categoryOptions}
          value={categoryId}
          onChange={setCategoryId}
          placeholder="카테고리 선택"
        />
      </div>
      <div className="form-field">
        <label htmlFor="income-amount" className="form-label">
          금액 *
        </label>
        <input
          id="income-amount"
          type="number"
          min={1}
          className="input-number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="금액"
          aria-required="true"
          aria-invalid={!!errorMessage}
        />
      </div>
      <div className="form-field">
        <label htmlFor="income-occurred-at" className="form-label">
          발생일 *
        </label>
        <input
          id="income-occurred-at"
          type="date"
          className="input-text"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          aria-required="true"
          aria-invalid={!!errorMessage}
        />
      </div>
      <div className="form-field">
        <label htmlFor="income-memo" className="form-label">
          메모
        </label>
        <input
          id="income-memo"
          type="text"
          className="input-text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모 (선택)"
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
