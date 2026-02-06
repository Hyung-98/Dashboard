import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  BUDGET_ALERT_KEY,
  DEFAULT_CHART_PERIOD_KEY,
  getBudgetAlertEnabled,
  getDefaultChartPeriod,
  type ChartPeriod,
} from "@/lib/settings";

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [budgetAlertEnabled, setBudgetAlertEnabledState] = useState(getBudgetAlertEnabled);
  const [defaultChartPeriod, setDefaultChartPeriodState] = useState<ChartPeriod>(getDefaultChartPeriod);

  const setBudgetAlertEnabled = (enabled: boolean) => {
    localStorage.setItem(BUDGET_ALERT_KEY, String(enabled));
    setBudgetAlertEnabledState(enabled);
  };

  const setDefaultChartPeriod = (period: ChartPeriod) => {
    localStorage.setItem(DEFAULT_CHART_PERIOD_KEY, period);
    setDefaultChartPeriodState(period);
  };

  return (
    <div>
      <header className="page-header">
        <h1>설정</h1>
      </header>

      <section className="settings-section" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>테마</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label className="checkbox-label">
            <input
              type="radio"
              name="theme"
              checked={theme === "light"}
              onChange={() => setTheme("light")}
              aria-label="라이트"
            />
            라이트
          </label>
          <label className="checkbox-label">
            <input
              type="radio"
              name="theme"
              checked={theme === "dark"}
              onChange={() => setTheme("dark")}
              aria-label="다크"
            />
            다크
          </label>
        </div>
      </section>

      <section className="settings-section" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>알림</h2>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={budgetAlertEnabled}
            onChange={(e) => setBudgetAlertEnabled(e.target.checked)}
            aria-label="예산 초과 시 알림 표시"
          />
          예산 초과 시 대시보드·예산 페이지에 알림 표시
        </label>
      </section>

      <section className="settings-section">
        <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>대시보드</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label htmlFor="settings-default-chart-period" className="form-label" style={{ marginBottom: 0 }}>
            기본 집계 단위
          </label>
          <select
            id="settings-default-chart-period"
            className="input-text"
            value={defaultChartPeriod}
            onChange={(e) => setDefaultChartPeriod(e.target.value as ChartPeriod)}
            style={{ width: "auto" }}
          >
            <option value="daily">일별</option>
            <option value="weekly">주별</option>
            <option value="monthly">월별</option>
            <option value="yearly">연별</option>
          </select>
        </div>
      </section>
    </div>
  );
}
