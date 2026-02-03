import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useCategories, useSeedDefaultCategories } from "@/api/hooks";

const nav = [
  { to: "/", label: "대시보드" },
  { to: "/expenses", label: "지출" },
  { to: "/incomes", label: "수입" },
  { to: "/budgets", label: "예산" },
  { to: "/assets", label: "자산" },
  { to: "/categories", label: "카테고리" },
];

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { data: categories = [], isSuccess: categoriesLoaded } = useCategories();
  const seedCategories = useSeedDefaultCategories();
  const hasTriedSeed = useRef(false);

  useEffect(() => {
    if (!categoriesLoaded || categories.length > 0 || hasTriedSeed.current || seedCategories.isPending) return;
    hasTriedSeed.current = true;
    seedCategories.mutate();
  }, [categoriesLoaded, categories.length, seedCategories.isPending]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav
        style={{
          width: 200,
          padding: "1rem",
          borderRight: "1px solid #e2e8f0",
          background: "#fff",
        }}
      >
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {nav.map(({ to, label }) => (
            <li key={to} style={{ marginBottom: "0.5rem" }}>
              <Link
                to={to}
                style={{
                  color: location.pathname === to ? "#0f172a" : "#64748b",
                  fontWeight: location.pathname === to ? 600 : 400,
                }}
              >
                {label}
              </Link>
            </li>
          ))}
          <li style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: "0.875rem",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              로그아웃
            </button>
          </li>
        </ul>
      </nav>
      <main style={{ flex: 1, padding: "1.5rem" }}>{children}</main>
    </div>
  );
}
