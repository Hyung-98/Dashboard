import { useState } from "react";
import { useCreateStockHolding, useUpdateStockHolding } from "@/api/hooks";
import { Select, type SelectOption } from "@/components/ui";
import type { StockHolding } from "@/types/domain";

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
        <label style={labelStyle}>종목코드(티커) *</label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="예: 005930, AAPL"
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>시장 *</label>
        <Select
          options={marketOptions}
          value={market}
          onChange={(v) => setMarket(v as "KR" | "US")}
          placeholder="시장 선택"
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>종목명 (선택)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 삼성전자, Apple"
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>보유 수량 *</label>
        <input
          type="number"
          min={0}
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="수량"
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>평균 매수가 * {market === "US" ? "(달러 기준)" : "(원 기준)"}</label>
        <input
          type="number"
          min={0}
          step="any"
          value={averageBuyPrice}
          onChange={(e) => setAverageBuyPrice(e.target.value)}
          placeholder={market === "US" ? "달러 단가 (예: 150.25)" : "원 단가"}
          style={inputStyle}
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>메모</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="비고"
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
