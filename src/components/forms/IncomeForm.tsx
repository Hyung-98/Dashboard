import { useState } from "react";
import { useCategories, useCreateIncome, useUpdateIncome } from "@/api/hooks";
import { Select, type SelectOption } from "@/components/ui";
import type { IncomeWithCategory } from "@/types/domain";

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
          placeholder="금액"
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>발생일 *</label>
        <input type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} style={inputStyle} />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>메모</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모 (선택)"
          style={inputStyle}
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
