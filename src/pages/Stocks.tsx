import { useState, useMemo } from "react";
import { useStockHoldings, useStockPrices, useDeleteStockHolding } from "@/api/hooks";
import { priceKey } from "@/api/stockPrice";
import { Table, TableSkeleton, Modal } from "@/components/ui";
import { StockForm } from "@/components/forms";
import type { Column } from "@/components/ui";
import type { StockHolding } from "@/types/domain";

const buttonStyle = {
  padding: "0.25rem 0.5rem",
  fontSize: "0.75rem",
  border: "none",
  borderRadius: 4,
  cursor: "pointer" as const,
  marginRight: 4,
};

function formatStockMoney(value: number, market: "KR" | "US"): string {
  const str = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return market === "US" ? `$${str}` : `${str}원`;
}

export function Stocks() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<StockHolding | null>(null);
  const { data: holdings = [], isLoading, isError, error } = useStockHoldings();
  const { data: prices = {}, isLoading: pricesLoading } = useStockPrices(holdings);
  const deleteStockHolding = useDeleteStockHolding();

  const columns: Column<StockHolding>[] = useMemo(
    () => [
      {
        key: "name",
        header: "종목",
        render: (row) => (row.name?.trim() ? `${row.name} (${row.symbol})` : row.symbol),
      },
      {
        key: "market",
        header: "시장",
        render: (row) => row.market,
      },
      {
        key: "quantity",
        header: "수량",
        render: (row) => row.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      },
      {
        key: "average_buy_price",
        header: "평균 매수가",
        render: (row) => formatStockMoney(Number(row.average_buy_price), row.market),
      },
      {
        key: "current_price",
        header: "현재가",
        render: (row) => {
          const key = priceKey(row.market, row.symbol);
          const price = prices[key];
          if (pricesLoading) return "…";
          if (price == null) return "-";
          return formatStockMoney(price, row.market);
        },
      },
      {
        key: "market_value",
        header: "평가금액",
        render: (row) => {
          const key = priceKey(row.market, row.symbol);
          const price = prices[key];
          if (price == null) return "-";
          const value = price * Number(row.quantity);
          return formatStockMoney(value, row.market);
        },
      },
      {
        key: "pnl",
        header: "손익",
        render: (row) => {
          const key = priceKey(row.market, row.symbol);
          const price = prices[key];
          const costBasis = Number(row.quantity) * Number(row.average_buy_price);
          if (price == null) return "-";
          const marketValue = price * Number(row.quantity);
          const profit = marketValue - costBasis;
          const pct = costBasis > 0 ? (profit / costBasis) * 100 : 0;
          const sign = profit >= 0 ? "" : "-";
          const absStr = Math.abs(profit).toLocaleString(undefined, { maximumFractionDigits: 2 });
          const amountStr = row.market === "US" ? `$${absStr}` : `${absStr}원`;
          return (
            <span style={{ color: profit >= 0 ? "#16a34a" : "#dc2626" }}>
              {sign}
              {amountStr} ({pct >= 0 ? "+" : ""}
              {pct.toFixed(1)}%)
            </span>
          );
        },
      },
      {
        key: "actions",
        header: "작업",
        render: (row) => (
          <span onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              style={{ ...buttonStyle, background: "#e2e8f0", color: "#0f172a" }}
              onClick={() => setEditingHolding(row)}
            >
              수정
            </button>
            <button
              type="button"
              style={{ ...buttonStyle, background: "#fef2f2", color: "#dc2626" }}
              onClick={() => {
                if (window.confirm("이 종목을 삭제할까요?")) deleteStockHolding.mutate(row.id);
              }}
            >
              삭제
            </button>
          </span>
        ),
      },
    ],
    [prices, pricesLoading, deleteStockHolding.mutate]
  );

  if (isError) {
    return (
      <div style={{ padding: "1rem", color: "#dc2626" }}>
        <p>오류: {error?.message ?? "데이터를 불러오지 못했습니다."}</p>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <h1>주식</h1>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          style={{
            padding: "0.5rem 1rem",
            background: "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          종목 추가
        </button>
      </header>
      <Modal
        open={addModalOpen || editingHolding != null}
        onClose={() => {
          setAddModalOpen(false);
          setEditingHolding(null);
        }}
        title={editingHolding ? "종목 수정" : "종목 추가"}
      >
        <StockForm
          key={editingHolding?.id ?? "new"}
          initialData={editingHolding ?? undefined}
          onSuccess={() => {
            setAddModalOpen(false);
            setEditingHolding(null);
          }}
        />
      </Modal>
      {isLoading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : (
        <Table<StockHolding>
          columns={columns}
          data={holdings}
          getRowKey={(row) => row.id}
          emptyMessage="등록된 주식이 없습니다. 종목 추가로 보유 종목을 등록하세요."
        />
      )}
    </div>
  );
}
