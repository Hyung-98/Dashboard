import { useState } from "react";
import { useCategories, useCreateExpense, useUpdateExpense, useBudgets } from "@/api/hooks";
import { Select, type SelectOption } from "@/components/ui";
import type { ExpenseWithCategory } from "@/types/domain";

export interface ExpenseFormProps {
  initialData?: ExpenseWithCategory | null;
  onSuccess?: () => void;
}

export function ExpenseForm({ initialData, onSuccess }: ExpenseFormProps) {
  const isEdit = Boolean(initialData?.id);
  const [categoryId, setCategoryId] = useState<string | null>(initialData?.category_id ?? null);
  const [amount, setAmount] = useState<string>(initialData?.amount != null ? String(initialData.amount) : "");
  const [occurredAt, setOccurredAt] = useState<string>(initialData?.occurred_at ?? "");
  const [memo, setMemo] = useState<string>(initialData?.memo ?? "");
  const [budgetId, setBudgetId] = useState<string | null>(initialData?.budget_id ?? null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: budgets = [] } = useBudgets();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const categoryOptions: SelectOption[] = expenseCategories.map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const budgetOptions: SelectOption[] = budgets.map((b) => ({
    value: b.id,
    label: `${b.categories?.name ?? "-"} / ${b.amount.toLocaleString()}원`,
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
        await updateExpense.mutateAsync({
          id: initialData.id,
          payload: {
            category_id: categoryId,
            amount: amountNum,
            occurred_at: occurredAt,
            memo: memo.trim() || null,
            budget_id: budgetId || null,
          },
        });
      } else {
        await createExpense.mutateAsync({
          category_id: categoryId,
          amount: amountNum,
          occurred_at: occurredAt,
          memo: memo.trim() || null,
          budget_id: budgetId || null,
        });
      }
      onSuccess?.();
    } catch {
      // Error is available on createExpense.error / updateExpense.error
    }
  };

  const errorMessage =
    validationError ??
    (createExpense.error as Error | null)?.message ??
    (updateExpense.error as Error | null)?.message ??
    null;
  const isPending = createExpense.isPending || updateExpense.isPending;
  const errorId = "expense-form-error";

  return (
    <form onSubmit={handleSubmit} aria-describedby={errorMessage ? errorId : undefined}>
      {errorMessage && (
        <div id={errorId} className="error-alert" role="alert" aria-live="assertive" style={{ marginBottom: "1rem" }}>
          {errorMessage}
        </div>
      )}
      <div className="form-field">
        <label htmlFor="expense-category" className="form-label">
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
        <label htmlFor="expense-amount" className="form-label">
          금액 *
        </label>
        <input
          id="expense-amount"
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
        <label htmlFor="expense-occurred-at" className="form-label">
          발생일 *
        </label>
        <input
          id="expense-occurred-at"
          type="date"
          className="input-text"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          aria-required="true"
          aria-invalid={!!errorMessage}
        />
      </div>
      <div className="form-field">
        <label htmlFor="expense-memo" className="form-label">
          메모
        </label>
        <input
          id="expense-memo"
          type="text"
          className="input-text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모 (선택)"
        />
      </div>
      <div className="form-field">
        <label htmlFor="expense-budget" className="form-label">
          예산 연결
        </label>
        <Select options={budgetOptions} value={budgetId} onChange={setBudgetId} placeholder="예산 선택 (선택)" />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "저장 중..." : isEdit ? "수정" : "저장"}
        </button>
      </div>
    </form>
  );
}
