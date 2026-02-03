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
import { useExpenses, useIncomes, useBudgets, useAssets } from "@/api/hooks";
import { useTheme } from "@/contexts/ThemeContext";
import { CardSkeleton } from "@/components/ui";
import { DEFAULT_EXPENSE_FILTERS, DEFAULT_INCOME_FILTERS } from "@/types/filters";

/* Design system: secondary palette + chart variety */
const COLORS = ["#4578F9", "#43B430", "#FFBC11", "#ef4444", "#CB3EFF", "#ec4899"];

const SUMMARY_IDS = ["expense", "budget", "income", "asset", "net"] as const;
const CHART_IDS = ["line", "pie", "lineIncome", "pieIncome", "barBudget", "pieAsset"] as const;
const STORAGE_SUMMARY = "dashboard-summary-order";
const STORAGE_CHART = "dashboard-chart-order";

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

function SortableSummaryCard({
  id,
  label,
  value,
  valueStyle,
}: {
  id: string;
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
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

function SortableChartCard({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
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

  useEffect(() => {
    saveOrder(STORAGE_SUMMARY, summaryOrder);
  }, [summaryOrder]);
  useEffect(() => {
    saveOrder(STORAGE_CHART, chartOrder);
  }, [chartOrder]);

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
        const ids = summaryOrder.map((id) => `summary-${id}`);
        const oldIndex = ids.indexOf(activeStr);
        const newIndex = ids.indexOf(overStr);
        if (oldIndex !== -1 && newIndex !== -1) {
          setSummaryOrder((prev) => arrayMove(prev, oldIndex, newIndex));
        }
      } else if (activeStr.startsWith("chart-") && overStr.startsWith("chart-")) {
        const ids = chartOrder.map((id) => `chart-${id}`);
        const oldIndex = ids.indexOf(activeStr);
        const newIndex = ids.indexOf(overStr);
        if (oldIndex !== -1 && newIndex !== -1) {
          setChartOrder((prev) => arrayMove(prev, oldIndex, newIndex));
        }
      }
    },
    [summaryOrder, chartOrder]
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
  const trendFrom = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 12);
    return d.toISOString().slice(0, 10);
  }, []);
  const trendTo = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const expenseFiltersTrend = useMemo(
    () => ({ ...DEFAULT_EXPENSE_FILTERS, from: trendFrom, to: trendTo }),
    [trendFrom, trendTo]
  );
  const incomeFiltersTrend = useMemo(
    () => ({ ...DEFAULT_INCOME_FILTERS, from: trendFrom, to: trendTo }),
    [trendFrom, trendTo]
  );
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(expenseFilters);
  const { data: expensesTrend = [] } = useExpenses(expenseFiltersTrend);
  const { data: incomes = [], isLoading: incomesLoading } = useIncomes(incomeFilters);
  const { data: incomesTrend = [] } = useIncomes(incomeFiltersTrend);
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();
  const { data: assets = [], isLoading: assetsLoading } = useAssets();

  function isExpenseInBudgetPeriod(occurredAt: string, periodStart: string, period: "monthly" | "yearly"): boolean {
    if (period === "monthly") return occurredAt.slice(0, 7) === periodStart.slice(0, 7);
    return occurredAt.slice(0, 4) === periodStart.slice(0, 4);
  }

  const monthlyData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    expensesTrend.forEach((e) => {
      const month = e.occurred_at.slice(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + Number(e.amount);
    });
    return Object.entries(byMonth)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [expensesTrend]);

  const categoryData = useMemo(() => {
    const byCat: Record<string, number> = {};
    expenses.forEach((e) => {
      const name = e.categories?.name ?? "기타";
      byCat[name] = (byCat[name] ?? 0) + Number(e.amount);
    });
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const monthlyIncomeData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    incomesTrend.forEach((i) => {
      const month = i.occurred_at.slice(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + Number(i.amount);
    });
    return Object.entries(byMonth)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [incomesTrend]);

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

  const assetCategoryData = useMemo(() => {
    const byCat: Record<string, number> = {};
    assets.forEach((a) => {
      const name = a.categories?.name ?? "기타";
      byCat[name] = (byCat[name] ?? 0) + Number(a.amount);
    });
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [assets]);

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
            : `${netAmount >= 0 ? "" : "-"}${Math.abs(netAmount).toLocaleString()}원`,
        valueStyle: id === "net" ? { color: netAmount >= 0 ? "#16a34a" : "#dc2626" } : undefined,
      })),
    [summaryOrder, totalExpense, totalBudget, totalIncome, totalAsset, netAmount]
  );

  const summarySortableIds = useMemo(() => summaryOrder.map((id) => `summary-${id}`), [summaryOrder]);
  const chartSortableIds = useMemo(() => chartOrder.map((id) => `chart-${id}`), [chartOrder]);

  const isLoading = expensesLoading || incomesLoading || budgetsLoading || assetsLoading;

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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={summarySortableIds} strategy={rectSortingStrategy}>
          <div className="dashboard-summary-grid">
            {summaryItems.map((item) => (
              <SortableSummaryCard
                key={item.id}
                id={item.id}
                label={item.label}
                value={item.value}
                valueStyle={item.valueStyle}
              />
            ))}
          </div>
        </SortableContext>

        <SortableContext items={chartSortableIds} strategy={rectSortingStrategy}>
          <div className="dashboard-chart-grid">
            {chartOrder.map((id) => {
              if (id === "line") {
                return (
                  <SortableChartCard key="line" id="line" title="월별 지출 추이">
                    {monthlyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={monthlyData}>
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
                  <SortableChartCard key="pie" id="pie" title="지출 카테고리별 비율">
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
                  <SortableChartCard key="lineIncome" id="lineIncome" title="월별 수입 추이">
                    {monthlyIncomeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={monthlyIncomeData}>
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
                  <SortableChartCard key="pieIncome" id="pieIncome" title="수입 카테고리별 비율">
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
                  <SortableChartCard key="barBudget" id="barBudget" title="예산 대비 사용액">
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
                  <SortableChartCard key="pieAsset" id="pieAsset" title="자산 카테고리별 비율">
                    {assetCategoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={assetCategoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {assetCategoryData.map((_, i) => (
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
      </DndContext>
    </div>
  );
}
