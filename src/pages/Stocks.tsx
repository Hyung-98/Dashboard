import { useState, useMemo } from "react";
import {
  useStockHoldings,
  useStockPrices,
  useDeleteStockHolding,
  useStockTransactions,
  useDeleteStockTransaction,
} from "@/api/hooks";
import { priceKey } from "@/api/stockPrice";
import type { StockTransaction } from "@/api/stockTransactions";
import { Table, TableSkeleton, Modal } from "@/components/ui";
import { StockForm, StockTransactionForm } from "@/components/forms";
import type { Column } from "@/components/ui";
import type { StockHolding } from "@/types/domain";

function formatStockMoney(value: number, market: "KR" | "US"): string {
  const str = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return market === "US" ? `$${str}` : `${str}원`;
}

/** 정렬 비교용 값 반환. 계산 컬럼(market_value, pnl, current_price, percentage)은 prices 기준. */
function getSortValue(
  sortKey: string,
  row: StockHolding,
  prices: Record<string, number | null>,
  totalValue: number
): string | number {
  switch (sortKey) {
    case "name":
      return (row.name?.trim() || row.symbol) ?? "";
    case "market":
      return row.market ?? "";
    case "quantity":
      return Number(row.quantity);
    case "average_buy_price":
      return Number(row.average_buy_price);
    case "current_price": {
      const key = priceKey(row.market, row.symbol);
      return prices[key] ?? 0;
    }
    case "market_value": {
      const key = priceKey(row.market, row.symbol);
      const price = prices[key];
      if (price == null) return 0;
      return price * Number(row.quantity);
    }
    case "pnl": {
      const key = priceKey(row.market, row.symbol);
      const price = prices[key];
      const costBasis = Number(row.quantity) * Number(row.average_buy_price);
      if (price == null) return 0;
      return price * Number(row.quantity) - costBasis;
    }
    case "percentage": {
      const key = priceKey(row.market, row.symbol);
      const price = prices[key];
      if (price == null || totalValue === 0) return 0;
      const marketValue = price * Number(row.quantity);
      return (marketValue / totalValue) * 100;
    }
    default:
      return ((row as unknown as Record<string, unknown>)[sortKey] as string | number) ?? "";
  }
}

export function Stocks() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<StockHolding | null>(null);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const { data: holdings = [], isLoading, isError, error } = useStockHoldings();
  const { data: prices = {}, isLoading: pricesLoading } = useStockPrices(holdings);
  const { data: transactions = [], isLoading: txLoading } = useStockTransactions();
  const deleteStockHolding = useDeleteStockHolding();
  const deleteStockTransaction = useDeleteStockTransaction();
  const [sortKey, setSortKey] = useState<string | null>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const columns: Column<StockHolding>[] = useMemo(
    () => [
      {
        key: "name",
        header: "종목",
        sortable: true,
        render: (row) => (row.name?.trim() ? `${row.name} (${row.symbol})` : row.symbol),
      },
      {
        key: "market",
        header: "시장",
        sortable: true,
        render: (row) => row.market,
      },
      {
        key: "quantity",
        header: "수량",
        sortable: true,
        render: (row) => row.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      },
      {
        key: "average_buy_price",
        header: "평균 매수가",
        sortable: true,
        render: (row) => formatStockMoney(Number(row.average_buy_price), row.market),
      },
      {
        key: "current_price",
        header: "현재가",
        sortable: true,
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
        sortable: true,
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
        sortable: true,
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
            <span className={profit >= 0 ? "text-trend-up" : "text-trend-down"}>
              {sign}
              {amountStr} ({pct >= 0 ? "+" : ""}
              {pct.toFixed(1)}%)
            </span>
          );
        },
      },
      {
        key: "percentage",
        header: "비중",
        sortable: true,
        render: (row) => {
          const totalValue = holdings.reduce((sum, h) => {
            const key = priceKey(h.market, h.symbol);
            const price = prices[key];
            if (price == null) return sum;
            return sum + price * Number(h.quantity);
          }, 0);
          const key = priceKey(row.market, row.symbol);
          const price = prices[key];
          if (price == null || totalValue === 0) return "-";
          const marketValue = price * Number(row.quantity);
          const pct = (marketValue / totalValue) * 100;
          return `${pct.toFixed(2)}%`;
        },
      },
      {
        key: "actions",
        header: "작업",
        render: (row) => (
          <span onClick={(e) => e.stopPropagation()}>
            <button type="button" className="btn-edit" onClick={() => setEditingHolding(row)}>
              수정
            </button>
            <button
              type="button"
              className="btn-danger"
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
    [prices, pricesLoading, deleteStockHolding, holdings]
  );

  const totalValue = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const key = priceKey(h.market, h.symbol);
      const price = prices[key];
      if (price == null) return sum;
      return sum + price * Number(h.quantity);
    }, 0);
  }, [holdings, prices]);

  const sortedHoldings = useMemo(() => {
    if (!sortKey) return holdings;
    const sorted = [...holdings].sort((a, b) => {
      const aVal = getSortValue(sortKey, a, prices, totalValue);
      const bVal = getSortValue(sortKey, b, prices, totalValue);
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal ?? "");
      const bStr = String(bVal ?? "");
      return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return sorted;
  }, [holdings, sortKey, sortDirection, prices, totalValue]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };
  if (isError) {
    return (
      <div className="error-alert" role="alert">
        <p>오류: {error?.message ?? "데이터를 불러오지 못했습니다."}</p>
      </div>
    );
  }

  return (
    <div className="stocks-page">
      <header className="page-header">
        <h1>주식</h1>
        <button type="button" className="btn-primary" onClick={() => setAddModalOpen(true)}>
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
          data={sortedHoldings}
          getRowKey={(row) => row.id}
          emptyMessage="등록된 주식이 없습니다. 종목 추가로 보유 종목을 등록하세요."
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}

      <section style={{ marginTop: "2rem" }} aria-label="거래 내역">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "1.125rem", margin: 0 }}>거래 내역</h2>
          <button type="button" className="btn-secondary" onClick={() => setTxModalOpen(true)}>
            거래 추가
          </button>
        </header>
        <Modal
          open={txModalOpen}
          onClose={() => setTxModalOpen(false)}
          title="거래 추가"
        >
          <StockTransactionForm
            onSuccess={() => setTxModalOpen(false)}
          />
        </Modal>
        {txLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <Table<StockTransaction>
            columns={[
              { key: "occurred_at", header: "날짜", render: (row) => row.occurred_at },
              { key: "symbol", header: "종목", render: (row) => row.symbol },
              { key: "market", header: "시장", render: (row) => row.market },
              {
                key: "side",
                header: "매수/매도",
                render: (row) => (row.side === "buy" ? "매수" : "매도"),
              },
              {
                key: "quantity",
                header: "수량",
                render: (row) => row.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 }),
              },
              {
                key: "price",
                header: "단가",
                render: (row) => formatStockMoney(Number(row.price), row.market),
              },
              {
                key: "memo",
                header: "메모",
                render: (row) => row.memo ?? "-",
              },
              {
                key: "actions",
                header: "작업",
                render: (row) => (
                  <span onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => {
                        if (window.confirm("이 거래를 삭제할까요?")) deleteStockTransaction.mutate(row.id);
                      }}
                    >
                      삭제
                    </button>
                  </span>
                ),
              },
            ]}
            data={transactions}
            getRowKey={(row) => row.id}
            emptyMessage="등록된 거래 내역이 없습니다."
          />
        )}
      </section>
    </div>
  );
}
