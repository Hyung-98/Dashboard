import { describe, it, expect } from "vitest";

/**
 * Copied from supabase/functions/kis-kr-price/index.ts for unit testing.
 * KIS expects 6-character 종목코드.
 * Codes like "0072R0" (ETF/ETN with letter classification) are valid and sent as-is.
 * For pure numeric codes, pad with leading zeros to 6 digits.
 */
function toSixDigitSymbol(s: string): string {
  const code = s.trim().toUpperCase();

  // Already 6 characters (may include letters like "0072R0") — use as-is
  if (code.length === 6) return code;

  // Extract digits and pad to 6
  const digits = code.replace(/\D/g, "");
  if (digits.length >= 6) return digits.slice(0, 6);
  return digits.padStart(6, "0");
}

describe("toSixDigitSymbol", () => {
  describe("영문자 포함 ETF/ETN 종목코드", () => {
    it("0072R0 → 그대로 0072R0 반환", () => {
      expect(toSixDigitSymbol("0072R0")).toBe("0072R0");
    });

    it("소문자 입력도 대문자로 변환하여 반환", () => {
      expect(toSixDigitSymbol("0072r0")).toBe("0072R0");
    });

    it("5765S0 (ETN 코드) → 그대로 반환", () => {
      expect(toSixDigitSymbol("5765S0")).toBe("5765S0");
    });

    it("Q500T0 (영문자 다수 포함) → 그대로 반환", () => {
      expect(toSixDigitSymbol("Q500T0")).toBe("Q500T0");
    });
  });

  describe("일반 숫자 종목코드", () => {
    it("005930 (삼성전자, 6자리) → 그대로 반환", () => {
      expect(toSixDigitSymbol("005930")).toBe("005930");
    });

    it("5930 (4자리) → 앞에 0 패딩하여 005930", () => {
      expect(toSixDigitSymbol("5930")).toBe("005930");
    });

    it("35720 (5자리, 카카오) → 035720", () => {
      expect(toSixDigitSymbol("35720")).toBe("035720");
    });

    it("1 (1자리) → 000001", () => {
      expect(toSixDigitSymbol("1")).toBe("000001");
    });

    it("12345678 (8자리, 초과) → 앞 6자리만 사용 123456", () => {
      expect(toSixDigitSymbol("12345678")).toBe("123456");
    });
  });

  describe("공백 및 트림 처리", () => {
    it("앞뒤 공백 제거", () => {
      expect(toSixDigitSymbol("  005930  ")).toBe("005930");
    });

    it("영문자 포함 코드의 앞뒤 공백 제거", () => {
      expect(toSixDigitSymbol(" 0072R0 ")).toBe("0072R0");
    });
  });
});
