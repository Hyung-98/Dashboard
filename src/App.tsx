import { Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Expenses } from "@/pages/Expenses";
import { Budgets } from "@/pages/Budgets";
import { Assets } from "@/pages/Assets";
import { Categories } from "@/pages/Categories";
import { Incomes } from "@/pages/Incomes";

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
          <Route path="/categories" element={<Categories />} />
          <Route path="/incomes" element={<Incomes />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
