import { useState, useEffect } from "react";
import { useUpsertPortfolioTargets } from "@/api/hooks";
import type { StockHolding, PortfolioTarget } from "@/types/domain";

export interface PortfolioTargetFormProps {
  holdings: StockHolding[];
  existingTargets: PortfolioTarget[];
  onSuccess?: () => void;
}

export function PortfolioTargetForm({
  holdings,
  existingTargets,
  onSuccess,
}: PortfolioTargetFormProps) {
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const upsert = useUpsertPortfolioTargets();

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const h of holdings) {
      const key = `${h.market}:${h.symbol}`;
      const existing = existingTargets.find(
        (t) => t.market === h.market && t.symbol === h.symbol
      );
      initial[key] = existing ? String(existing.target_pct) : "";
    }
    setPercentages(initial);
  }, [holdings, existingTargets]);

  const handleChange = (key: string, value: string) => {
    setPercentages((prev) => ({ ...prev, [key]: value }));
  };

  const total = holdings.reduce((sum, h) => {
    const key = `${h.market}:${h.symbol}`;
    const num = Number(percentages[key] ?? "0");
    return sum + (Number.isNaN(num) ? 0 : num);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const targets: Array<{ symbol: string; market: "KR" | "US"; target_pct: number }> = [];

    for (const h of holdings) {
      const key = `${h.market}:${h.symbol}`;
      const raw = percentages[key]?.trim() ?? "";
      if (raw === "" || raw === "0") continue;
      const num = Number(raw);
      if (Number.isNaN(num) || num < 0 || num > 100) {
        const label = h.name?.trim() || h.symbol;
        setValidationError(`${label}: 0~100 사이의 숫자를 입력하세요.`);
        return;
      }
      targets.push({ symbol: h.symbol, market: h.market, target_pct: num });
    }

    const sum = targets.reduce((s, t) => s + t.target_pct, 0);
    if (sum > 0 && Math.abs(sum - 100) > 0.01) {
      setValidationError(
        `목표 비중 합계가 ${sum.toFixed(1)}%입니다. 100%가 되어야 합니다.`
      );
      return;
    }

    try {
      await upsert.mutateAsync(targets);
      onSuccess?.();
    } catch {
      // Error shown via mutation error
    }
  };

  const errorMessage =
    validationError ?? (upsert.error as Error | null)?.message ?? null;
  const errorId = "portfolio-target-form-error";

  return (
    <form onSubmit={handleSubmit} aria-describedby={errorMessage ? errorId : undefined}>
      {errorMessage && (
        <div id={errorId} className="error-alert" role="alert" style={{ marginBottom: "1rem" }}>
          {errorMessage}
        </div>
      )}
      {holdings.map((h) => {
        const key = `${h.market}:${h.symbol}`;
        const label = h.name?.trim() ? `${h.name} (${h.symbol})` : h.symbol;
        return (
          <div className="form-field" key={key}>
            <label className="form-label">{label}</label>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="number"
                min={0}
                max={100}
                step="any"
                className="input-number"
                value={percentages[key] ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder="0"
                style={{ maxWidth: 120 }}
              />
              <span>%</span>
            </div>
          </div>
        );
      })}
      <div
        style={{
          marginTop: "0.5rem",
          marginBottom: "1rem",
          fontSize: "0.875rem",
          color:
            Math.abs(total - 100) < 0.01
              ? "var(--color-accent-green)"
              : "var(--color-text-secondary)",
          fontWeight: 600,
        }}
      >
        합계: {total.toFixed(1)}%
        {total > 0 && Math.abs(total - 100) >= 0.01 && (
          <span style={{ color: "#ef4444", marginLeft: 8 }}>
            (100%
            {total < 100
              ? `까지 ${(100 - total).toFixed(1)}% 부족`
              : `보다 ${(total - 100).toFixed(1)}% 초과`}
            )
          </span>
        )}
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={upsert.isPending}>
          {upsert.isPending ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
