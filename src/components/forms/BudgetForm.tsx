import { useState } from "react";
import { useCategories, useCreateBudget, useUpdateBudget } from "@/api/hooks";
import { Select, type SelectOption } from "@/components/ui";
import type { BudgetPeriod } from "@/types/database";
import type { BudgetWithCategory } from "@/types/domain";

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
        <label style={labelStyle}>카테고리 *</label>
        <Select options={categoryOptions} value={categoryId} onChange={setCategoryId} placeholder="카테고리 선택" />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>금액 *</label>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="예산 금액"
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>주기 *</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value as BudgetPeriod)} style={inputStyle}>
          <option value="monthly">월</option>
          <option value="yearly">년</option>
        </select>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>기간 시작일 *</label>
        <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={inputStyle} />
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
