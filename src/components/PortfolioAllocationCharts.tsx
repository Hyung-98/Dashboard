import { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { priceKey } from "@/api/stockPrice";
import { usePortfolioTargets } from "@/api/hooks";
import { Modal } from "@/components/ui";
import { PortfolioTargetForm } from "@/components/forms";
import type { StockHolding, PortfolioTarget } from "@/types/domain";

const COLORS = ["#4578F9", "#43B430", "#FFBC11", "#ef4444", "#CB3EFF", "#ec4899"];

interface PortfolioAllocationChartsProps {
  holdings: StockHolding[];
  prices: Record<string, number | null>;
  pricesLoading: boolean;
}

export function PortfolioAllocationCharts({
  holdings,
  prices,
  pricesLoading,
}: PortfolioAllocationChartsProps) {
  const { data: targets = [], isLoading: targetsLoading } = usePortfolioTargets();
  const [targetModalOpen, setTargetModalOpen] = useState(false);

  const currentAllocationData = useMemo(() => {
    if (holdings.length === 0) return [];

    const items = holdings
      .map((h) => {
        const key = priceKey(h.market, h.symbol);
        const price = prices[key];
        if (price == null) return null;
        const marketValue = price * Number(h.quantity);
        const name = h.name?.trim() ? h.name : h.symbol;
        return { name, value: Math.round(marketValue * 100) / 100 };
      })
      .filter((x): x is NonNullable<typeof x> => x != null && x.value > 0);

    return items;
  }, [holdings, prices]);

  const targetAllocationData = useMemo(() => {
    if (targets.length === 0) return [];
    return targets
      .filter((t: PortfolioTarget) => t.target_pct > 0)
      .map((t: PortfolioTarget) => {
        const holding = holdings.find(
          (h) => h.symbol === t.symbol && h.market === t.market
        );
        const name = holding?.name?.trim() ? holding.name : t.symbol;
        return { name, value: t.target_pct };
      });
  }, [targets, holdings]);

  if (holdings.length === 0) return null;

  const emptyChartStyle: React.CSSProperties = {
    height: 280,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--color-text-secondary)",
  };

  const currentOption: EChartsOption = {
    color: COLORS,
    tooltip: {
      trigger: "item",
      formatter: "{b}: {d}%",
    },
    legend: {
      bottom: 0,
      type: "scroll",
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "65%"],
        center: ["50%", "45%"],
        data: currentAllocationData,
        label: {
          formatter: "{b} {d}%",
          fontSize: 12,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
        },
      },
    ],
  };

  const targetOption: EChartsOption = {
    color: COLORS,
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c}%",
    },
    legend: {
      bottom: 0,
      type: "scroll",
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "65%"],
        center: ["50%", "45%"],
        data: targetAllocationData,
        label: {
          formatter: "{b} {c}%",
          fontSize: 12,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
        },
      },
    ],
  };

  return (
    <>
      <div className="dashboard-chart-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="dashboard-chart-card">
          <h3 className="chart-title">현재 포트폴리오 비중</h3>
          {pricesLoading ? (
            <div style={emptyChartStyle}>가격 로딩 중...</div>
          ) : currentAllocationData.length > 0 ? (
            <ReactECharts
              option={currentOption}
              style={{ height: 280, width: "100%" }}
              opts={{ renderer: "svg" }}
            />
          ) : (
            <div style={emptyChartStyle}>가격 데이터 없음</div>
          )}
        </div>

        <div className="dashboard-chart-card">
          <h3
            className="chart-title"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            목표 포트폴리오 비중
            <button
              type="button"
              className="btn-secondary"
              style={{ marginLeft: "auto", fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
              onClick={() => setTargetModalOpen(true)}
            >
              {targets.length > 0 ? "수정" : "설정"}
            </button>
          </h3>
          {targetsLoading ? (
            <div style={emptyChartStyle}>로딩 중...</div>
          ) : targetAllocationData.length > 0 ? (
            <ReactECharts
              option={targetOption}
              style={{ height: 280, width: "100%" }}
              opts={{ renderer: "svg" }}
            />
          ) : (
            <div style={emptyChartStyle}>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 0.5rem" }}>목표 비중이 설정되지 않았습니다.</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setTargetModalOpen(true)}
                >
                  목표 비중 설정
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        title="목표 포트폴리오 비중 설정"
      >
        <PortfolioTargetForm
          holdings={holdings}
          existingTargets={targets}
          onSuccess={() => setTargetModalOpen(false)}
        />
      </Modal>
    </>
  );
}
