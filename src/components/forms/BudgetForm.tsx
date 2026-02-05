import { useState } from "react";
import { useCategories, useCreateBudget, useUpdateBudget } from "@/api/hooks";
import { Select, type SelectOption } from "@/components/ui";
import type { BudgetPeriod } from "@/types/database";
import type { BudgetWithCategory } from "@/types/domain";

export interface BudgetFormProps {
  initialData?: BudgetWithCategory | null;
  onSuccess?: () => void;
}

export function BudgetForm({ initialData, onSuccess }: BudgetFormProps) {
  const isEdit = Boolean(initialData?.id);
  const [categoryId, setCategoryId] = useState<string | null>(initialData?.category_id ?? null);
  const [amount, setAmount] = useState<string>(initialData?.amount != null ? String(initialData.amount) : "");
  const [period, setPeriod] = useState<BudgetPeriod>(initialData?.period ?? "monthly");
  const [periodStart, setPeriodStart] = useState<string>(initialData?.period_start ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const categoryOptions: SelectOption[] = expenseCategories.map((c) => ({
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
    if (!periodStart.trim()) {
      setValidationError("기간 시작일을 입력하세요.");
      return;
    }

    try {
      if (isEdit && initialData?.id) {
        await updateBudget.mutateAsync({
          id: initialData.id,
          payload: {
            category_id: categoryId,
            amount: amountNum,
            period,
            period_start: periodStart,
          },
        });
      } else {
        await createBudget.mutateAsync({
          category_id: categoryId,
          amount: amountNum,
          period,
          period_start: periodStart,
        });
      }
      onSuccess?.();
    } catch {
      // Error is available on createBudget.error / updateBudget.error
    }
  };

  const errorMessage =
    validationError ??
    (createBudget.error as Error | null)?.message ??
    (updateBudget.error as Error | null)?.message ??
    null;
  const isPending = createBudget.isPending || updateBudget.isPending;
  const errorId = "budget-form-error";

  return (
    <form onSubmit={handleSubmit} aria-describedby={errorMessage ? errorId : undefined}>
      {errorMessage && (
        <div id={errorId} className="error-alert" role="alert" aria-live="assertive" style={{ marginBottom: "1rem" }}>
          {errorMessage}
        </div>
      )}
      <div className="form-field">
        <label htmlFor="budget-category" className="form-label">
          카테고리 *
        </label>
        <Select options={categoryOptions} value={categoryId} onChange={setCategoryId} placeholder="카테고리 선택" />
      </div>
      <div className="form-field">
        <label htmlFor="budget-amount" className="form-label">
          금액 *
        </label>
        <input
          id="budget-amount"
          type="number"
          min={1}
          className="input-number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="예산 금액"
          aria-required="true"
          aria-invalid={!!errorMessage}
        />
      </div>
      <div className="form-field">
        <label htmlFor="budget-period" className="form-label">
          주기 *
        </label>
        <select
          id="budget-period"
          className="input-text"
          value={period}
          onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
          aria-required="true"
        >
          <option value="monthly">월</option>
          <option value="yearly">년</option>
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="budget-period-start" className="form-label">
          기간 시작일 *
        </label>
        <input
          id="budget-period-start"
          type="date"
          className="input-text"
          value={periodStart}
          onChange={(e) => setPeriodStart(e.target.value)}
          aria-required="true"
          aria-invalid={!!errorMessage}
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
