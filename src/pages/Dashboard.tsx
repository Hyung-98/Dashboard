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
} from "recharts";
import { useExpenses, useIncomes, useBudgets, useAssets } from "@/api/hooks";
import { CardSkeleton } from "@/components/ui";
import { DEFAULT_EXPENSE_FILTERS, DEFAULT_INCOME_FILTERS } from "@/types/filters";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const SUMMARY_IDS = ["expense", "budget", "income", "asset", "net"] as const;
const CHART_IDS = ["line", "pie"] as const;
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

const cardStyle = {
  padding: "1.25rem",
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

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
    ...cardStyle,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginRight: 6 }}>⋮⋮</span>
      <div style={{ fontSize: "0.875rem", color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 600, ...valueStyle }}>{value}</div>
    </div>
  );
}

function SortableChartCard({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `chart-${id}`,
  });
  const style: React.CSSProperties = {
    ...cardStyle,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#94a3b8" }}>⋮⋮</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

export function Dashboard() {
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
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(expenseFilters);
  const { data: incomes = [], isLoading: incomesLoading } = useIncomes(incomeFilters);
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();
  const { data: assets = [], isLoading: assetsLoading } = useAssets();

  const monthlyData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    expenses.forEach((e) => {
      const month = e.occurred_at.slice(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + Number(e.amount);
    });
    return Object.entries(byMonth)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [expenses]);

  const categoryData = useMemo(() => {
    const byCat: Record<string, number> = {};
    expenses.forEach((e) => {
      const name = e.categories?.name ?? "기타";
      byCat[name] = (byCat[name] ?? 0) + Number(e.amount);
    });
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  }, [expenses]);

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
        <h1 style={{ marginBottom: "1rem" }}>대시보드</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
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
      <h1 style={{ marginBottom: "1rem" }}>대시보드</h1>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={summarySortableIds} strategy={rectSortingStrategy}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: "1.5rem",
            }}
          >
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              marginBottom: "1.5rem",
            }}
          >
            {chartOrder.map((id) =>
              id === "line" ? (
                <SortableChartCard key="line" id="line" title="월별 지출 추이">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}원`} />
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString()}원`, "지출"]} />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </SortableChartCard>
              ) : (
                <SortableChartCard key="pie" id="pie" title="카테고리별 비율">
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
                    <div
                      style={{
                        height: 280,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                      }}
                    >
                      데이터 없음
                    </div>
                  )}
                </SortableChartCard>
              )
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
