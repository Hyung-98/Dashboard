import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useCategories, useSeedDefaultCategories } from "@/api/hooks";
import { useTheme } from "@/contexts/ThemeContext";
import Lottie from "lottie-react";

import ReactLogo from "@/assets/lottie/ReactLogo.json";

const nav = [
  { to: "/", label: "대시보드", icon: "chart" },
  { to: "/expenses", label: "지출", icon: "wallet" },
  { to: "/incomes", label: "수입", icon: "income" },
  { to: "/budgets", label: "예산", icon: "budget" },
  { to: "/assets", label: "자산", icon: "asset" },
  { to: "/stocks", label: "주식", icon: "stock" },
  { to: "/savings-goals", label: "저축 목표", icon: "budget" },
  { to: "/categories", label: "카테고리", icon: "category" },
  { to: "/report", label: "리포트", icon: "chart" },
  { to: "/settings", label: "설정", icon: "category" },
];

// const pathToTitle: Record<string, string> = {
//   "/": "대시보드",
//   "/dashboard": "대시보드",
//   "/expenses": "지출",
//   "/incomes": "수입",
//   "/budgets": "예산",
//   "/assets": "자산",
//   "/stocks": "주식",
//   "/categories": "카테고리",
// };

// function getPageTitle(pathname: string): string {
//   return pathToTitle[pathname] ?? "대시보드";
// }

function NavIcon({ name }: { name: string }) {
  const className = "nav-icon";
  const stroke = "currentColor";
  const size = 20;
  switch (name) {
    case "chart":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        >
          <path d="M3 3v18h18" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      );
    case "wallet":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        >
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <path d="M1 10h22" />
        </svg>
      );
    case "income":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        >
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      );
    case "budget":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
      );
    case "asset":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      );
    case "stock":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        >
          <polyline points="22 6 13.5 14.5 8.5 9.5 2 18" />
          <path d="M16 6h6v6" />
        </svg>
      );
    case "category":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        >
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        </svg>
      );
    case "logout":
      return (
        <svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
    default:
      return null;
  }
}

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const { data: categories = [], isSuccess: categoriesLoaded } = useCategories();
  const seedCategories = useSeedDefaultCategories();
  const hasTriedSeed = useRef(false);

  useEffect(() => {
    if (!categoriesLoaded || categories.length > 0 || hasTriedSeed.current || seedCategories.isPending) return;
    hasTriedSeed.current = true;
    seedCategories.mutate();
  }, [categoriesLoaded, categories.length, seedCategories.isPending, seedCategories]);

  const closeNav = () => setNavOpen(false);

  return (
    <div className="app-shell">
      <div
        className={`app-nav-backdrop ${navOpen ? "open" : ""}`}
        onClick={closeNav}
        onKeyDown={(e) => e.key === "Escape" && closeNav()}
        role="button"
        tabIndex={-1}
        aria-hidden
      />
      <nav className={`app-nav ${navOpen ? "open" : ""}`} aria-label="메인 메뉴">
        <button
          type="button"
          className="app-nav-toggle"
          onClick={() => setNavOpen((o) => !o)}
          aria-label="메뉴 열기"
          aria-expanded={navOpen}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <div className="app-nav-brand">
          <div className="app-nav-brand-icon">
            <Lottie animationData={ReactLogo} style={{ width: "100%", height: "100%" }} />
          </div>
          <span className="app-nav-brand-text">자산관리</span>
          <button
            type="button"
            className="app-nav-close"
            onClick={() => setNavOpen(false)}
            aria-label="메뉴 닫기"
            aria-expanded={navOpen}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className="app-nav-list">
          {nav.map(({ to, label, icon }) => (
            <li key={to}>
              <Link to={to} onClick={closeNav} className={location.pathname === to ? "active" : ""}>
                <NavIcon name={icon} />
                {label}
              </Link>
            </li>
          ))}
          <li className="nav-divider">
            <button
              type="button"
              onClick={() => {
                closeNav();
                supabase.auth.signOut();
              }}
            >
              <NavIcon name="logout" />
              로그아웃
            </button>
          </li>
        </ul>
      </nav>
      <main className="app-main">
        <header className="app-header">
          {/* <h2 className="app-header-title">{getPageTitle(location.pathname)}</h2> */}
          <div className="app-header-actions">
            <button
              type="button"
              className={`theme-toggle ${theme === "light" ? "active" : ""}`}
              onClick={toggleTheme}
              aria-label="라이트 모드"
              title="라이트 모드"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </button>
            <button
              type="button"
              className={`theme-toggle ${theme === "dark" ? "active" : ""}`}
              onClick={toggleTheme}
              aria-label="다크 모드"
              title="다크 모드"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
