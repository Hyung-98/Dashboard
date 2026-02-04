/**
 * Supabase Database types.
 * Generate with Supabase MCP generate_typescript_types, or define manually until schema is applied.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CategoryType = "expense" | "asset" | "income";
export type BudgetPeriod = "monthly" | "yearly";
export type StockMarket = "KR" | "US";

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          type: CategoryType;
        };
        Insert: {
          id?: string;
          name: string;
          type: CategoryType;
        };
        Update: {
          id?: string;
          name?: string;
          type?: CategoryType;
        };
      };
      expenses: {
        Row: {
          id: string;
          category_id: string;
          budget_id: string | null;
          amount: number;
          occurred_at: string;
          memo: string | null;
          created_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          category_id: string;
          budget_id?: string | null;
          amount: number;
          occurred_at: string;
          memo?: string | null;
          created_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string;
          budget_id?: string | null;
          amount?: number;
          occurred_at?: string;
          memo?: string | null;
          created_at?: string;
          user_id?: string | null;
        };
      };
      budgets: {
        Row: {
          id: string;
          category_id: string;
          amount: number;
          period: BudgetPeriod;
          period_start: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          category_id: string;
          amount: number;
          period: BudgetPeriod;
          period_start: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string;
          amount?: number;
          period?: BudgetPeriod;
          period_start?: string;
          user_id?: string | null;
        };
      };
      assets: {
        Row: {
          id: string;
          category_id: string | null;
          amount: number;
          name: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          amount: number;
          name: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          amount?: number;
          name?: string;
          updated_at?: string;
          user_id?: string | null;
        };
      };
      incomes: {
        Row: {
          id: string;
          category_id: string;
          amount: number;
          occurred_at: string;
          memo: string | null;
          created_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          category_id: string;
          amount: number;
          occurred_at: string;
          memo?: string | null;
          created_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string;
          amount?: number;
          occurred_at?: string;
          memo?: string | null;
          created_at?: string;
          user_id?: string | null;
        };
      };
      stock_holdings: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          market: StockMarket;
          name: string | null;
          quantity: number;
          average_buy_price: number;
          memo: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          market: StockMarket;
          name?: string | null;
          quantity: number;
          average_buy_price: number;
          memo?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          market?: StockMarket;
          name?: string | null;
          quantity?: number;
          average_buy_price?: number;
          memo?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      check_email_exists: {
        Args: { check_email: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Insertable<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type Updatable<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
