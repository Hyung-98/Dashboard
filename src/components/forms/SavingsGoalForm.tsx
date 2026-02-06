import { useState } from "react";
import { useCreateSavingsGoal, useUpdateSavingsGoal } from "@/api/hooks";
import type { SavingsGoal } from "@/api/savingsGoals";

export interface SavingsGoalFormProps {
  initialData?: SavingsGoal | null;
  onSuccess?: () => void;
}

export function SavingsGoalForm({ initialData, onSuccess }: SavingsGoalFormProps) {
  const isEdit = Boolean(initialData?.id);
  const [name, setName] = useState<string>(initialData?.name ?? "");
  const [targetAmount, setTargetAmount] = useState<string>(
    initialData?.target_amount != null ? String(initialData.target_amount) : ""
  );
  const [currentAmount, setCurrentAmount] = useState<string>(
    initialData?.current_amount != null ? String(initialData.current_amount) : "0"
  );
  const [targetDate, setTargetDate] = useState<string>(initialData?.target_date ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const targetNum = Number(targetAmount);
    const currentNum = Number(currentAmount);
    if (!name.trim()) {
      setValidationError("목표 이름을 입력하세요.");
      return;
    }
    if (!targetAmount.trim() || Number.isNaN(targetNum) || targetNum <= 0) {
      setValidationError("목표 금액을 0보다 큰 숫자로 입력하세요.");
      return;
    }
    if (Number.isNaN(currentNum) || currentNum < 0) {
      setValidationError("현재 금액을 0 이상으로 입력하세요.");
      return;
    }
    if (currentNum > targetNum) {
      setValidationError("현재 금액은 목표 금액을 초과할 수 없습니다.");
      return;
    }

    try {
      if (isEdit && initialData?.id) {
        await updateGoal.mutateAsync({
          id: initialData.id,
          payload: {
            name: name.trim(),
            target_amount: targetNum,
            current_amount: currentNum,
            target_date: targetDate.trim() || null,
          },
        });
      } else {
        await createGoal.mutateAsync({
          name: name.trim(),
          target_amount: targetNum,
          current_amount: currentNum,
          target_date: targetDate.trim() || null,
        });
      }
      onSuccess?.();
    } catch {
      // Error surfaced via mutation.error
    }
  };

  const errorMessage =
    validationError ??
    (createGoal.error as Error | null)?.message ??
    (updateGoal.error as Error | null)?.message ??
    null;
  const isPending = createGoal.isPending || updateGoal.isPending;
  const errorId = "savings-goal-form-error";

  return (
    <form onSubmit={handleSubmit} aria-describedby={errorMessage ? errorId : undefined}>
      {errorMessage && (
        <div id={errorId} className="error-alert" role="alert" aria-live="assertive" style={{ marginBottom: "1rem" }}>
          {errorMessage}
        </div>
      )}
      <div className="form-field">
        <label htmlFor="savings-goal-name" className="form-label">
          목표 이름 *
        </label>
        <input
          id="savings-goal-name"
          type="text"
          className="input-text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 비상금 500만원"
          aria-required="true"
          aria-invalid={!!errorMessage}
        />
      </div>
      <div className="form-field">
        <label htmlFor="savings-goal-target" className="form-label">
          목표 금액 *
        </label>
        <input
          id="savings-goal-target"
          type="number"
          min={1}
          className="input-number"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          placeholder="목표 금액"
          aria-required="true"
          aria-invalid={!!errorMessage}
        />
      </div>
      <div className="form-field">
        <label htmlFor="savings-goal-current" className="form-label">
          현재 금액
        </label>
        <input
          id="savings-goal-current"
          type="number"
          min={0}
          className="input-number"
          value={currentAmount}
          onChange={(e) => setCurrentAmount(e.target.value)}
          placeholder="0"
          aria-invalid={!!errorMessage}
        />
      </div>
      <div className="form-field">
        <label htmlFor="savings-goal-date" className="form-label">
          목표일 (선택)
        </label>
        <input
          id="savings-goal-date"
          type="date"
          className="input-text"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
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
