import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useExpenseFilters } from "./useExpenseFilters";

function createWrapper(initialEntries: string[] = ["/"]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
  };
}

describe("useExpenseFilters", () => {
  it("returns default filters when no search params", () => {
    const { result } = renderHook(() => useExpenseFilters(), {
      wrapper: createWrapper(["/"]),
    });
    expect(result.current[0]).toEqual({
      from: "",
      to: "",
      categoryId: null,
      minAmount: null,
      maxAmount: null,
    });
  });

  it("parses filters from URL search params", () => {
    const { result } = renderHook(() => useExpenseFilters(), {
      wrapper: createWrapper(["/?from=2024-01-01&to=2024-12-31&categoryId=cat-1&minAmount=1000&maxAmount=50000"]),
    });
    expect(result.current[0]).toEqual({
      from: "2024-01-01",
      to: "2024-12-31",
      categoryId: "cat-1",
      minAmount: 1000,
      maxAmount: 50000,
    });
  });

  it("updates filters (and URL) when setFilters is called", () => {
    const wrapper = createWrapper(["/"]);
    const { result } = renderHook(() => useExpenseFilters(), { wrapper });

    act(() => {
      result.current[1]({ from: "2024-06-01", to: "2024-06-30", categoryId: "cat-2" });
    });

    expect(result.current[0]).toMatchObject({
      from: "2024-06-01",
      to: "2024-06-30",
      categoryId: "cat-2",
    });
  });

  it("merges partial updates with current filters", () => {
    const wrapper = createWrapper(["/?from=2024-01-01&to=2024-12-31"]);
    const { result } = renderHook(() => useExpenseFilters(), { wrapper });

    act(() => {
      result.current[1]({ categoryId: "cat-1" });
    });

    expect(result.current[0].from).toBe("2024-01-01");
    expect(result.current[0].to).toBe("2024-12-31");
    expect(result.current[0].categoryId).toBe("cat-1");
  });
});
