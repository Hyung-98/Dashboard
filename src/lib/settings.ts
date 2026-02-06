export const BUDGET_ALERT_KEY = "dashboard-budget-alert-enabled";
export const DEFAULT_CHART_PERIOD_KEY = "dashboard-default-chart-period";

export type ChartPeriod = "daily" | "weekly" | "monthly" | "yearly";

export function getBudgetAlertEnabled(): boolean {
  try {
    const v = localStorage.getItem(BUDGET_ALERT_KEY);
    if (v === "false") return false;
    if (v === "true") return true;
  } catch {}
  return true;
}

export function getDefaultChartPeriod(): ChartPeriod {
  try {
    const v = localStorage.getItem(DEFAULT_CHART_PERIOD_KEY);
    if (["daily", "weekly", "monthly", "yearly"].includes(v ?? "")) return v as ChartPeriod;
  } catch {}
  return "monthly";
}
