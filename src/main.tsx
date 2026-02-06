import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthInit } from "@/components/AuthInit";
import App from "./App";
import "./index.css";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (typeof sentryDsn === "string" && sentryDsn.length > 0) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 3,
      refetchOnWindowFocus: true,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <ThemeProvider>
          <AuthInit>
            <App />
          </AuthInit>
        </ThemeProvider>
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>
);
