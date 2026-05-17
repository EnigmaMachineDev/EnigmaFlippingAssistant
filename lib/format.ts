import { format, formatDistanceToNow, differenceInDays } from "date-fns";

export function formatCurrency(amount: number, currency = "USD"): string {
  const absStr = Math.abs(amount).toFixed(2);
  const formatted = parseFloat(absStr).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currency === "USD" ? "$" : currency;
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

export function formatDateShort(iso: string): string {
  try {
    return format(new Date(iso), "MMM d");
  } catch {
    return iso;
  }
}

export function formatRelative(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function daysBetween(startIso: string, endIso: string): number {
  try {
    return Math.abs(differenceInDays(new Date(endIso), new Date(startIso)));
  } catch {
    return 0;
  }
}

export function daysAgo(iso: string): number {
  return daysBetween(iso, new Date().toISOString());
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}
