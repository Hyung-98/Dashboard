import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { useExpenses, useIncomes, useBudgets, useAssets, useStockHoldings, useStockPrices, useSavingsGoals } from "@/api/hooks";
import { priceKey } from "@/api/stockPrice";
import { useTheme } from "@/contexts/ThemeContext";
import { CardSkeleton, DateRangePicker, Select, type SelectOption } from "@/components/ui";
import { getBudgetAlertEnabled, getDefaultChartPeriod } from "@/lib/settings";
import { DEFAULT_EXPENSE_FILTERS, DEFAULT_INCOME_FILTERS } from "@/types/filters";

export type ChartPeriod = "daily" | "weekly" | "monthly" | "yearly";

function getDefaultChartDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 12);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

/** ISO week: Monday as start of week. Returns YYYY-MM-DD of Monday. */
function getWeekStartKey(occurredAt: string): string {
  const s = occurredAt.slice(0, 10);
  const d = new Date(s + "T12:00:00");
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diff);
  return monday.toISOString().slice(0, 10);
}

function aggregateByPeriod<T extends { occurred_at: string; amount: number }>(
  items: T[],
  period: ChartPeriod
): { name: string; value: number }[] {
  const bucket: Record<string, number> = {};
  for (const item of items) {
    const key =
      period === "daily"
        ? item.occurred_at.slice(0, 10)
        : period === "weekly"
        ? getWeekStartKey(item.occurred_at)
        : period === "monthly"
        ? item.occurred_at.slice(0, 7)
        : item.occurred_at.slice(0, 4);
    bucket[key] = (bucket[key] ?? 0) + Number(item.amount);
  }
  return Object.entries(bucket)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* Design system: secondary palette + chart variety */
const COLORS = ["#4578F9", "#43B430", "#FFBC11", "#ef4444", "#CB3EFF", "#ec4899"];

const SUMMARY_IDS = ["expense", "budget", "income", "asset", "stock", "net"] as const;
const CHART_IDS = ["line", "pie", "lineIncome", "pieIncome", "barBudget", "pieAsset"] as const;

const CHART_PERIOD_LABELS: Record<ChartPeriod, string> = {
  daily: "일별",
  weekly: "주별",
  monthly: "월별",
  yearly: "연별",
};
const STORAGE_SUMMARY = "dashboard-summary-order";
const STORAGE_CHART = "dashboard-chart-order";
const STORAGE_HIDDEN_SUMMARY = "dashboard-hidden-summary";
const STORAGE_HIDDEN_CHART = "dashboard-hidden-chart";

const SUMMARY_LABELS: Record<string, string> = {
  expense: "이번 달 지출",
  budget: "예산 합계",
  income: "이번 달 수입",
  asset: "자산 합계",
  stock: "주식 평가",
  net: "순이익 (수입 - 지출)",
};
const CHART_TITLES: Record<string, string> = {
  line: "지출 추이",
  pie: "지출 카테고리별 비율",
  lineIncome: "수입 추이",
  pieIncome: "수입 카테고리별 비율",
  barBudget: "예산 대비 사용액",
  pieAsset: "자산 카테고리별 비율",
};

function loadOrder<T extends string>(key: string, defaultOrder: readonly T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [...defaultOrder];
    const parsed = JSON.parse(raw) as string[];
    const seen = new Set<T>();
    const result: T[] = [];
    for (const id of parsed) {
      if (defaultOrder.includes(id as T) && !seen.has(id as T)) {
        seen.add(id as T);
        result.push(id as T);
      }
    }
    for (const id of defaultOrder) {
      if (!seen.has(id)) result.push(id);
    }
    return result;
  } catch {
    return [...defaultOrder];
  }
}

function saveOrder(key: string, order: string[]) {
  localStorage.setItem(key, JSON.stringify(order));
}

function loadHidden(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHidden(key: string, ids: string[]) {
  localStorage.setItem(key, JSON.stringify(ids));
}

function SortableSummaryCard({
  id,
  label,
  value,
  valueStyle,
  onHide,
}: {
  id: string;
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
  onHide?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `summary-${id}`,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };
  return (
    <div ref={setNodeRef} className="dashboard-kpi-card" style={style} {...attributes} {...listeners}>
      <span style={{ fontSize: "0.75rem", marginRight: 6, opacity: 0.7 }} aria-hidden>
        ⋮⋮
      </span>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={valueStyle}>
        {value}
      </div>
      {onHide && (
        <button
          type="button"
          className="dashboard-widget-hide-btn"
          onClick={(e) => {
            e.stopPropagation();
            onHide(id);
          }}
          aria-label={`${label} 숨기기`}
          title="숨기기"
        >
          숨기기
        </button>
      )}
    </div>
  );
}

const emptyChartStyle: React.CSSProperties = {
  height: 280,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--color-text-secondary)",
};

function SortableChartCard({
  id,
  title,
  children,
  onHide,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  onHide?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `chart-${id}`,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };
  return (
    <div ref={setNodeRef} className="dashboard-chart-card" style={style} {...attributes} {...listeners}>
      <h3 className="chart-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ opacity: 0.7 }} aria-hidden>
          ⋮⋮
        </span>
        {title}
        {onHide && (
          <button
            type="button"
            className="dashboard-widget-hide-btn"
            onClick={(e) => {
              e.stopPropagation();
              onHide(id);
            }}
            aria-label={`${title} 숨기기`}
            title="숨기기"
            style={{ marginLeft: "auto" }}
          >
            숨기기
          </button>
        )}
      </h3>
      {children}
    </div>
  );
}

export function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridStroke = isDark ? "#27272a" : "#f1f5f9";
  const [summaryOrder, setSummaryOrder] = useState<string[]>(() => loadOrder(STORAGE_SUMMARY, SUMMARY_IDS));
  const [chartOrder, setChartOrder] = useState<string[]>(() => loadOrder(STORAGE_CHART, CHART_IDS));
  const [hiddenSummaryIds, setHiddenSummaryIds] = useState<string[]>(() => loadHidden(STORAGE_HIDDEN_SUMMARY));
  const [hiddenChartIds, setHiddenChartIds] = useState<string[]>(() => loadHidden(STORAGE_HIDDEN_CHART));
  const defaultRange = useMemo(getDefaultChartDateRange, []);
  const [chartDateFrom, setChartDateFrom] = useState<string>(defaultRange.from);
  const [chartDateTo, setChartDateTo] = useState<string>(defaultRange.to);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(getDefaultChartPeriod);

  const visibleSummaryOrder = useMemo(
    () => summaryOrder.filter((id) => !hiddenSummaryIds.includes(id)),
    [summaryOrder, hiddenSummaryIds]
  );
  const visibleChartOrder = useMemo(
    () => chartOrder.filter((id) => !hiddenChartIds.includes(id)),
    [chartOrder, hiddenChartIds]
  );

  useEffect(() => {
    saveOrder(STORAGE_SUMMARY, summaryOrder);
  }, [summaryOrder]);
  useEffect(() => {
    saveOrder(STORAGE_CHART, chartOrder);
  }, [chartOrder]);
  useEffect(() => {
    saveHidden(STORAGE_HIDDEN_SUMMARY, hiddenSummaryIds);
  }, [hiddenSummaryIds]);
  useEffect(() => {
    saveHidden(STORAGE_HIDDEN_CHART, hiddenChartIds);
  }, [hiddenChartIds]);

  const hideSummary = useCallback((id: string) => {
    setHiddenSummaryIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);
  const hideChart = useCallback((id: string) => {
    setHiddenChartIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);
  const showSummary = useCallback((id: string) => {
    setHiddenSummaryIds((prev) => prev.filter((x) => x !== id));
  }, []);
  const showChart = useCallback((id: string) => {
    setHiddenChartIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const activeStr = String(active.id);
      const overStr = String(over.id);
      if (activeStr.startsWith("summary-") && overStr.startsWith("summary-")) {
        const visibleIds = visibleSummaryOrder;
        const oldIndex = visibleIds.indexOf(activeStr.replace("summary-", ""));
        const newIndex = visibleIds.indexOf(overStr.replace("summary-", ""));
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(visibleIds, oldIndex, newIndex);
          const hiddenIds = summaryOrder.filter((id) => hiddenSummaryIds.includes(id));
          setSummaryOrder([...reordered, ...hiddenIds]);
        }
      } else if (activeStr.startsWith("chart-") && overStr.startsWith("chart-")) {
        const visibleIds = visibleChartOrder;
        const oldIndex = visibleIds.indexOf(activeStr.replace("chart-", ""));
        const newIndex = visibleIds.indexOf(overStr.replace("chart-", ""));
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(visibleIds, oldIndex, newIndex);
          const hiddenIds = chartOrder.filter((id) => hiddenChartIds.includes(id));
          setChartOrder([...reordered, ...hiddenIds]);
        }
      }
    },
    [
      visibleSummaryOrder,
      visibleChartOrder,
      summaryOrder,
      chartOrder,
      hiddenSummaryIds,
      hiddenChartIds,
    ]
  );

  const expenseFilters = useMemo(
    () => ({
      ...DEFAULT_EXPENSE_FILTERS,
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
    }),
    []
  );
  const incomeFilters = useMemo(
    () => ({
      ...DEFAULT_INCOME_FILTERS,
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
    }),
    []
  );
  const expenseFiltersTrend = useMemo(
    () => ({ ...DEFAULT_EXPENSE_FILTERS, from: chartDateFrom, to: chartDateTo }),
    [chartDateFrom, chartDateTo]
  );
  const incomeFiltersTrend = useMemo(
    () => ({ ...DEFAULT_INCOME_FILTERS, from: chartDateFrom, to: chartDateTo }),
    [chartDateFrom, chartDateTo]
  );
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(expenseFilters);
  const { data: expensesTrend = [] } = useExpenses(expenseFiltersTrend);
  const { data: incomes = [], isLoading: incomesLoading } = useIncomes(incomeFilters);
  const { data: incomesTrend = [] } = useIncomes(incomeFiltersTrend);
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const { data: holdings = [], isLoading: holdingsLoading } = useStockHoldings();
  const { data: prices = {}, isLoading: pricesLoading } = useStockPrices(holdings);
  const { data: savingsGoals = [], isLoading: savingsGoalsLoading } = useSavingsGoals();

  function isExpenseInBudgetPeriod(occurredAt: string, periodStart: string, period: "monthly" | "yearly"): boolean {
    if (period === "monthly") return occurredAt.slice(0, 7) === periodStart.slice(0, 7);
    return occurredAt.slice(0, 4) === periodStart.slice(0, 4);
  }

  const trendExpenseData = useMemo(() => aggregateByPeriod(expensesTrend, chartPeriod), [expensesTrend, chartPeriod]);

  const categoryData = useMemo(() => {
    const byCat: Record<string, number> = {};
    expenses.forEach((e) => {
      const name = e.categories?.name ?? "기타";
      byCat[name] = (byCat[name] ?? 0) + Number(e.amount);
    });
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const trendIncomeData = useMemo(() => aggregateByPeriod(incomesTrend, chartPeriod), [incomesTrend, chartPeriod]);

  const incomeCategoryData = useMemo(() => {
    const byCat: Record<string, number> = {};
    incomes.forEach((i) => {
      const name = i.categories?.name ?? "기타";
      byCat[name] = (byCat[name] ?? 0) + Number(i.amount);
    });
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [incomes]);

  const budgetVsSpentData = useMemo(() => {
    return budgets.map((b) => {
      const spent = expensesTrend
        .filter((e) => e.budget_id === b.id && isExpenseInBudgetPeriod(e.occurred_at, b.period_start, b.period))
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const categoryName = b.categories?.name ?? "기타";
      const label =
        b.period === "yearly"
          ? `${categoryName} (${b.period_start.slice(0, 4)}년)`
          : `${categoryName} (${b.period_start.slice(0, 7)})`;
      return {
        name: label,
        budget: Number(b.amount),
        spent,
      };
    });
  }, [budgets, expensesTrend]);

  const budgetOverrunCount = useMemo(
    () => budgetVsSpentData.filter((d) => d.spent > d.budget).length,
    [budgetVsSpentData]
  );

  const assetCategoryData = useMemo(() => {
    const byCat: Record<string, number> = {};
    assets.forEach((a) => {
      const name = a.categories?.name ?? "기타";
      byCat[name] = (byCat[name] ?? 0) + Number(a.amount);
    });
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [assets]);

  const totalStockValue = useMemo(() => {
    let sum = 0;
    for (const h of holdings) {
      const p = prices[priceKey(h.market, h.symbol)];
      if (p != null) sum += p * Number(h.quantity);
    }
    return sum;
  }, [holdings, prices]);

  const assetChartData = useMemo(() => {
    const base = [...assetCategoryData];
    if (totalStockValue > 0) base.push({ name: "주식", value: totalStockValue });
    return base;
  }, [assetCategoryData, totalStockValue]);

  const totalExpense = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount), 0), [expenses]);
  const totalIncome = useMemo(() => incomes.reduce((sum, i) => sum + Number(i.amount), 0), [incomes]);
  const totalBudget = useMemo(() => budgets.reduce((sum, b) => sum + Number(b.amount), 0), [budgets]);
  const totalAsset = useMemo(() => assets.reduce((sum, a) => sum + Number(a.amount), 0), [assets]);
  const netAmount = totalIncome - totalExpense;

  const summaryItems = useMemo(
    () =>
      summaryOrder.map((id) => ({
        id,
        label:
          id === "expense"
            ? "이번 달 지출"
            : id === "budget"
            ? "예산 합계"
            : id === "income"
            ? "이번 달 수입"
            : id === "asset"
            ? "자산 합계"
            : id === "stock"
            ? "주식 평가"
            : "순이익 (수입 - 지출)",
        value:
          id === "expense"
            ? `${totalExpense.toLocaleString()}원`
            : id === "budget"
            ? `${totalBudget.toLocaleString()}원`
            : id === "income"
            ? `${totalIncome.toLocaleString()}원`
            : id === "asset"
            ? `${totalAsset.toLocaleString()}원`
            : id === "stock"
            ? pricesLoading && holdings.length > 0
              ? "…"
              : `${totalStockValue.toLocaleString()}원`
            : `${netAmount >= 0 ? "" : "-"}${Math.abs(netAmount).toLocaleString()}원`,
        valueStyle: id === "net" ? { color: netAmount >= 0 ? "#16a34a" : "#dc2626" } : undefined,
      })),
    [
      summaryOrder,
      totalExpense,
      totalBudget,
      totalIncome,
      totalAsset,
      totalStockValue,
      netAmount,
      pricesLoading,
      holdings.length,
    ]
  );

  const summarySortableIds = useMemo(
    () => visibleSummaryOrder.map((id) => `summary-${id}`),
    [visibleSummaryOrder]
  );
  const chartSortableIds = useMemo(
    () => visibleChartOrder.map((id) => `chart-${id}`),
    [visibleChartOrder]
  );
  const visibleSummaryItems = useMemo(
    () =>
      visibleSummaryOrder
        .map((id) => summaryItems.find((item) => item.id === id))
        .filter((x): x is (typeof summaryItems)[number] => x != null),
    [visibleSummaryOrder, summaryItems]
  );

  const isLoading =
    expensesLoading || incomesLoading || budgetsLoading || assetsLoading || holdingsLoading || savingsGoalsLoading;

  if (isLoading) {
    return (
      <div>
        <header className="page-header">
          <h1>대시보드</h1>
        </header>
        <div className="dashboard-summary-grid">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div style={{ marginTop: 24 }}>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <h1>대시보드</h1>
      </header>
      {getBudgetAlertEnabled() && budgetOverrunCount > 0 && (
        <div className="budget-overrun-alert" role="alert">
          <span>예산 초과: {budgetOverrunCount}건</span>
          <a href="#/budgets">예산 페이지로 이동</a>
        </div>
      )}
      {savingsGoals.length > 0 && (
        <section className="dashboard-savings-goals" aria-label="저축 목표 진행률" style={{ marginTop: "1rem" }}>
          <h2 style={{ fontSize: "0.875rem", marginBottom: 8, color: "var(--color-text-secondary)" }}>
            저축 목표 (목표 대비 %)
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {savingsGoals.map((g) => {
              const current = Number(g.current_amount);
              const target = Number(g.target_amount);
              const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
              return (
                <div
                  key={g.id}
                  style={{
                    padding: "0.75rem 1rem",
                    background: "var(--color-bg-secondary)",
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    minWidth: 160,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{g.name}</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                    {current.toLocaleString()}원 / {target.toLocaleString()}원
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      height: 8,
                      background: "var(--color-border)",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "var(--color-accent-green)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "0.75rem", marginTop: 4 }}>{pct}%</div>
                </div>
              );
            })}
          </div>
          <a href="#/savings-goals" style={{ fontSize: "0.875rem", marginTop: 8, display: "inline-block" }}>
            저축 목표 관리 →
          </a>
        </section>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={summarySortableIds} strategy={rectSortingStrategy}>
          <div className="dashboard-summary-grid">
            {visibleSummaryItems.map((item) => (
              <SortableSummaryCard
                key={item.id}
                id={item.id}
                label={item.label}
                value={item.value}
                valueStyle={item.valueStyle}
                onHide={hideSummary}
              />
            ))}
          </div>
        </SortableContext>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "1rem",
            marginTop: 24,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>차트 기간</span>
            <DateRangePicker
              from={chartDateFrom}
              to={chartDateTo}
              onChange={(from, to) => {
                setChartDateFrom(from);
                setChartDateTo(to);
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>집계 단위</span>
            <Select<ChartPeriod>
              options={
                [
                  { value: "daily", label: "일별" },
                  { value: "weekly", label: "주별" },
                  { value: "monthly", label: "월별" },
                  { value: "yearly", label: "연별" },
                ] as SelectOption<ChartPeriod>[]
              }
              value={chartPeriod}
              onChange={(v) => v != null && setChartPeriod(v)}
              placeholder="집계 단위"
            />
          </div>
        </div>

        <SortableContext items={chartSortableIds} strategy={rectSortingStrategy}>
          <div className="dashboard-chart-grid">
            {visibleChartOrder.map((id) => {
              if (id === "line") {
                return (
                  <SortableChartCard key="line" id="line" title={`${CHART_PERIOD_LABELS[chartPeriod]} 지출 추이`} onHide={hideChart}>
                    {trendExpenseData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={trendExpenseData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}원`} />
                          <Tooltip formatter={(v: number) => [`${v.toLocaleString()}원`, "지출"]} />
                          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={emptyChartStyle}>데이터 없음</div>
                    )}
                  </SortableChartCard>
                );
              }
              if (id === "pie") {
                return (
                  <SortableChartCard key="pie" id="pie" title="지출 카테고리별 비율" onHide={hideChart}>
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {categoryData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()}원`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={emptyChartStyle}>데이터 없음</div>
                    )}
                  </SortableChartCard>
                );
              }
              if (id === "lineIncome") {
                return (
                  <SortableChartCard
                    key="lineIncome"
                    id="lineIncome"
                    title={`${CHART_PERIOD_LABELS[chartPeriod]} 수입 추이`}
                    onHide={hideChart}
                  >
                    {trendIncomeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={trendIncomeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}원`} />
                          <Tooltip formatter={(v: number) => [`${v.toLocaleString()}원`, "수입"]} />
                          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={emptyChartStyle}>데이터 없음</div>
                    )}
                  </SortableChartCard>
                );
              }
              if (id === "pieIncome") {
                return (
                  <SortableChartCard key="pieIncome" id="pieIncome" title="수입 카테고리별 비율" onHide={hideChart}>
                    {incomeCategoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={incomeCategoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {incomeCategoryData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()}원`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={emptyChartStyle}>데이터 없음</div>
                    )}
                  </SortableChartCard>
                );
              }
              if (id === "barBudget") {
                return (
                  <SortableChartCard key="barBudget" id="barBudget" title="예산 대비 사용액" onHide={hideChart}>
                    {budgetVsSpentData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={budgetVsSpentData} margin={{ top: 8, right: 8, left: 8, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}원`} />
                          <Tooltip
                            formatter={(v: number, name: string) => [
                              `${v.toLocaleString()}원`,
                              name === "budget" ? "예산" : "사용액",
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="budget" name="예산" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="spent" name="사용액" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={emptyChartStyle}>데이터 없음</div>
                    )}
                  </SortableChartCard>
                );
              }
              if (id === "pieAsset") {
                return (
                  <SortableChartCard key="pieAsset" id="pieAsset" title="자산 카테고리별 비율" onHide={hideChart}>
                    {assetChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={assetChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {assetChartData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()}원`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={emptyChartStyle}>데이터 없음</div>
                    )}
                  </SortableChartCard>
                );
              }
              return null;
            })}
          </div>
        </SortableContext>

        {(hiddenSummaryIds.length > 0 || hiddenChartIds.length > 0) && (
          <section className="dashboard-hidden-widgets" aria-label="숨긴 위젯">
            <h3 style={{ fontSize: "0.875rem", marginBottom: 8, color: "var(--color-text-secondary)" }}>
              숨긴 위젯 ({hiddenSummaryIds.length + hiddenChartIds.length}개)
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {hiddenSummaryIds.map((id) => (
                <span key={`s-${id}`} className="dashboard-hidden-widget-chip">
                  {SUMMARY_LABELS[id] ?? id}
                  <button
                    type="button"
                    className="dashboard-widget-show-btn"
                    onClick={() => showSummary(id)}
                    aria-label={`${SUMMARY_LABELS[id] ?? id} 다시 표시`}
                  >
                    다시 표시
                  </button>
                </span>
              ))}
              {hiddenChartIds.map((id) => (
                <span key={`c-${id}`} className="dashboard-hidden-widget-chip">
                  {CHART_TITLES[id] ?? id}
                  <button
                    type="button"
                    className="dashboard-widget-show-btn"
                    onClick={() => showChart(id)}
                    aria-label={`${CHART_TITLES[id] ?? id} 다시 표시`}
                  >
                    다시 표시
                  </button>
                </span>
              ))}
            </div>
          </section>
        )}
      </DndContext>
    </div>
  );
}
