import { useState } from "react";
import { useCreateStockTransaction } from "@/api/hooks";
import { Select, type SelectOption } from "@/components/ui";

export interface StockTransactionFormProps {
  onSuccess?: () => void;
}

export function StockTransactionForm({ onSuccess }: StockTransactionFormProps) {
  const [symbol, setSymbol] = useState("");
  const [market, setMarket] = useState<"KR" | "US">("KR");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createTransaction = useCreateStockTransaction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const qty = Number(quantity);
    const pr = Number(price);
    if (!symbol.trim()) {
      setValidationError("종목코드를 입력하세요.");
      return;
    }
    if (!quantity.trim() || Number.isNaN(qty) || qty <= 0) {
      setValidationError("수량을 0보다 큰 숫자로 입력하세요.");
      return;
    }
    if (!price.trim() || Number.isNaN(pr) || pr < 0) {
      setValidationError("단가를 0 이상으로 입력하세요.");
      return;
    }
    if (!occurredAt.trim()) {
      setValidationError("거래일을 입력하세요.");
      return;
    }

    try {
      await createTransaction.mutateAsync({
        symbol: symbol.trim(),
        market,
        side,
        quantity: qty,
        price: pr,
        occurred_at: occurredAt,
        memo: memo.trim() || null,
      });
      onSuccess?.();
    } catch {
      // Error surfaced via mutation.error
    }
  };

  const errorMessage =
    validationError ?? (createTransaction.error as Error | null)?.message ?? null;
  const isPending = createTransaction.isPending;
  const errorId = "stock-transaction-form-error";

  const marketOptions: SelectOption[] = [
    { value: "KR", label: "KR" },
    { value: "US", label: "US" },
  ];
  const sideOptions: SelectOption[] = [
    { value: "buy", label: "매수" },
    { value: "sell", label: "매도" },
  ];

  return (
    <form onSubmit={handleSubmit} aria-describedby={errorMessage ? errorId : undefined}>
      {errorMessage && (
        <div id={errorId} className="error-alert" role="alert" style={{ marginBottom: "1rem" }}>
          {errorMessage}
        </div>
      )}
      <div className="form-field">
        <label htmlFor="tx-symbol" className="form-label">종목코드 *</label>
        <input
          id="tx-symbol"
          type="text"
          className="input-text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="예: 005930, AAPL"
          aria-required="true"
        />
      </div>
      <div className="form-field">
        <label className="form-label">시장</label>
        <Select<"KR" | "US">
          options={marketOptions as SelectOption<"KR" | "US">[]}
          value={market}
          onChange={(v) => v != null && setMarket(v)}
          placeholder="시장"
        />
      </div>
      <div className="form-field">
        <label className="form-label">매수/매도</label>
        <Select<"buy" | "sell">
          options={sideOptions as SelectOption<"buy" | "sell">[]}
          value={side}
          onChange={(v) => v != null && setSide(v)}
          placeholder="매수/매도"
        />
      </div>
      <div className="form-field">
        <label htmlFor="tx-quantity" className="form-label">수량 *</label>
        <input
          id="tx-quantity"
          type="number"
          min={0.0001}
          step="any"
          className="input-number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="수량"
          aria-required="true"
        />
      </div>
      <div className="form-field">
        <label htmlFor="tx-price" className="form-label">단가 *</label>
        <input
          id="tx-price"
          type="number"
          min={0}
          step="any"
          className="input-number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="단가"
          aria-required="true"
        />
      </div>
      <div className="form-field">
        <label htmlFor="tx-occurred-at" className="form-label">거래일 *</label>
        <input
          id="tx-occurred-at"
          type="date"
          className="input-text"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          aria-required="true"
        />
      </div>
      <div className="form-field">
        <label htmlFor="tx-memo" className="form-label">메모</label>
        <input
          id="tx-memo"
          type="text"
          className="input-text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모 (선택)"
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
