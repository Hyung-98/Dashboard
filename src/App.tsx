import { Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Expenses } from "@/pages/Expenses";
import { Budgets } from "@/pages/Budgets";
import { Assets } from "@/pages/Assets";
import { Stocks } from "@/pages/Stocks";
import { Categories } from "@/pages/Categories";
import { Incomes } from "@/pages/Incomes";
import { SavingsGoals } from "@/pages/SavingsGoals";
import { Report } from "@/pages/Report";
import { Settings } from "@/pages/Settings";

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="dashboard">
            <Route index element={<Dashboard />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/stocks" element={<Stocks />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/incomes" element={<Incomes />} />
          <Route path="/savings-goals" element={<SavingsGoals />} />
          <Route path="/report" element={<Report />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
