import {
  formatCurrency,
  formatPercent,
  formatDate,
  formatDateShort,
  daysBetween,
  truncate,
} from "../lib/format";

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats a positive USD amount", () => {
    expect(formatCurrency(100)).toBe("$100.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats a negative amount with leading minus", () => {
    expect(formatCurrency(-50)).toBe("-$50.00");
  });

  it("formats a negative decimal amount", () => {
    expect(formatCurrency(-12.5)).toBe("-$12.50");
  });

  it("formats large numbers with comma separators", () => {
    expect(formatCurrency(1234567.89)).toBe("$1,234,567.89");
  });

  it("rounds to two decimal places", () => {
    expect(formatCurrency(9.999)).toBe("$10.00");
  });

  it("uses the currency code as symbol for non-USD", () => {
    expect(formatCurrency(100, "EUR")).toBe("EUR100.00");
  });

  it("formats negative non-USD correctly", () => {
    expect(formatCurrency(-25, "GBP")).toBe("-GBP25.00");
  });
});

// ─── formatPercent ────────────────────────────────────────────────────────────

describe("formatPercent", () => {
  it("formats a value with one decimal by default", () => {
    expect(formatPercent(42.5)).toBe("42.5%");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("formats 100", () => {
    expect(formatPercent(100)).toBe("100.0%");
  });

  it("formats a negative value", () => {
    expect(formatPercent(-5.5)).toBe("-5.5%");
  });

  it("respects custom decimal count", () => {
    expect(formatPercent(33.333, 2)).toBe("33.33%");
  });

  it("rounds when decimal count is less than precision", () => {
    expect(formatPercent(12.678, 1)).toBe("12.7%");
  });
});

// ─── formatDate ───────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("formats an ISO string to MMM d, yyyy", () => {
    const result = formatDate("2025-06-15T00:00:00.000Z");
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2025/);
  });

  it("returns the original string when the input is not a valid date", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

// ─── formatDateShort ──────────────────────────────────────────────────────────

describe("formatDateShort", () => {
  it("formats an ISO string to MMM d (no year)", () => {
    const result = formatDateShort("2025-06-15T00:00:00.000Z");
    expect(result).toMatch(/Jun/);
    expect(result).not.toContain("2025");
  });

  it("returns the original string for invalid input", () => {
    expect(formatDateShort("bad-date")).toBe("bad-date");
  });
});

// ─── daysBetween ──────────────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("calculates the absolute difference in days between two dates", () => {
    expect(daysBetween("2025-01-01", "2025-02-01")).toBe(31);
  });

  it("returns the same result regardless of argument order", () => {
    expect(daysBetween("2025-02-01", "2025-01-01")).toBe(31);
  });

  it("returns 0 for the same date", () => {
    expect(daysBetween("2025-03-10", "2025-03-10")).toBe(0);
  });

  it("returns 0 when either argument is not a valid date", () => {
    expect(daysBetween("not-a-date", "2025-01-01")).toBe(0);
  });

  it("calculates across year boundaries", () => {
    expect(daysBetween("2024-12-31", "2025-01-01")).toBe(1);
  });

  it("calculates a full year (non-leap)", () => {
    expect(daysBetween("2025-01-01", "2026-01-01")).toBe(365);
  });
});

// ─── truncate ────────────────────────────────────────────────────────────────

describe("truncate", () => {
  it("returns the string unchanged when it is within the limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns the string unchanged when it equals the limit", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates and appends an ellipsis character when over the limit", () => {
    expect(truncate("hello world", 8)).toBe("hello w…");
  });

  it("handles an empty string", () => {
    expect(truncate("", 5)).toBe("");
  });

  it("truncates to a single character plus ellipsis at limit 2", () => {
    expect(truncate("abcde", 2)).toBe("a…");
  });

  it("truncates Unicode correctly (ellipsis counts as one char)", () => {
    const result = truncate("abcdefghij", 5);
    expect(result).toBe("abcd…");
    expect(result.length).toBe(5);
  });
});
