import { useState } from "react";
import { useCreateStockHolding, useUpdateStockHolding } from "@/api/hooks";
import { Select, type SelectOption } from "@/components/ui";
import type { StockHolding } from "@/types/domain";

const marketOptions: SelectOption[] = [
  { value: "KR", label: "한국 (KR)" },
  { value: "US", label: "미국 (US)" },
];

export interface StockFormProps {
  initialData?: StockHolding | null;
  onSuccess?: () => void;
}

export function StockForm({ initialData, onSuccess }: StockFormProps) {
  const isEdit = Boolean(initialData?.id);
  const [symbol, setSymbol] = useState<string>(initialData?.symbol ?? "");
  const [market, setMarket] = useState<"KR" | "US">(initialData?.market ?? "KR");
  const [name, setName] = useState<string>(initialData?.name ?? "");
  const [quantity, setQuantity] = useState<string>(initialData?.quantity != null ? String(initialData.quantity) : "");
  const [averageBuyPrice, setAverageBuyPrice] = useState<string>(
    initialData?.average_buy_price != null ? String(initialData.average_buy_price) : ""
  );
  const [memo, setMemo] = useState<string>(initialData?.memo ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createStockHolding = useCreateStockHolding();
  const updateStockHolding = useUpdateStockHolding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const quantityNum = Number(quantity);
    const averageNum = Number(averageBuyPrice);
    if (!symbol.trim()) {
      setValidationError("종목코드(티커)를 입력하세요.");
      return;
    }
    if (!quantity.trim() || Number.isNaN(quantityNum) || quantityNum <= 0) {
      setValidationError("보유 수량을 0보다 큰 숫자로 입력하세요.");
      return;
    }
    if (!averageBuyPrice.trim() || Number.isNaN(averageNum) || averageNum < 0) {
      setValidationError("평균 매수가를 0 이상의 숫자로 입력하세요.");
      return;
    }

    try {
      if (isEdit && initialData?.id) {
        await updateStockHolding.mutateAsync({
          id: initialData.id,
          payload: {
            symbol: symbol.trim(),
            market,
            name: name.trim() || null,
            quantity: quantityNum,
            average_buy_price: averageNum,
            memo: memo.trim() || null,
          },
        });
      } else {
        await createStockHolding.mutateAsync({
          symbol: symbol.trim(),
          market,
          name: name.trim() || null,
          quantity: quantityNum,
          average_buy_price: averageNum,
          memo: memo.trim() || null,
        });
      }
      onSuccess?.();
    } catch {
      // Error shown via mutation error
    }
  };

  const errorMessage =
    validationError ??
    (createStockHolding.error as Error | null)?.message ??
    (updateStockHolding.error as Error | null)?.message ??
    null;
  const isPending = createStockHolding.isPending || updateStockHolding.isPending;
  const errorId = "stock-form-error";

  return (
    <form onSubmit={handleSubmit} aria-describedby={errorMessage ? errorId : undefined}>
      {errorMessage && (
        <div id={errorId} className="error-alert" role="alert" aria-live="assertive" style={{ marginBottom: "1rem" }}>
          {errorMessage}
        </div>
      )}
      <div className="form-field">
        <label htmlFor="stock-symbol" className="form-label">
          종목코드(티커) *
        </label>
        <input
          id="stock-symbol"
          type="text"
          className="input-text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="예: 005930, AAPL"
          aria-required="true"
          aria-invalid={!!errorMessage}
        />
      </div>
      <div className="form-field">
        <label htmlFor="stock-market" className="form-label">
          시장 *
        </label>
        <Select
          options={marketOptions}
          value={market}
          onChange={(v) => setMarket(v as "KR" | "US")}
          placeholder="시장 선택"
        />
      </div>
      <div className="form-field">
        <label htmlFor="stock-name" className="form-label">
          종목명 (선택)
        </label>
        <input
          id="stock-name"
          type="text"
          className="input-text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 삼성전자, Apple"
        />
      </div>
      <div className="form-field">
        <label htmlFor="stock-quantity" className="form-label">
          보유 수량 *
        </label>
        <input
          id="stock-quantity"
          type="number"
          min={0}
          step="any"
          className="input-number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="수량"
          aria-required="true"
          aria-invalid={!!errorMessage}
        />
      </div>
      <div className="form-field">
        <label htmlFor="stock-average-buy-price" className="form-label">
          평균 매수가 * {market === "US" ? "(달러 기준)" : "(원 기준)"}
        </label>
        <input
          id="stock-average-buy-price"
          type="number"
          min={0}
          step="any"
          className="input-number"
          value={averageBuyPrice}
          onChange={(e) => setAverageBuyPrice(e.target.value)}
          placeholder={market === "US" ? "달러 단가 (예: 150.25)" : "원 단가"}
          aria-required="true"
          aria-invalid={!!errorMessage}
        />
      </div>
      <div className="form-field">
        <label htmlFor="stock-memo" className="form-label">
          메모
        </label>
        <input
          id="stock-memo"
          type="text"
          className="input-text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="비고"
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
