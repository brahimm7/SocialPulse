// src/utils/format.js

export function fmtNumber(n) {
  if (n == null) return "—";
  if (n >= 1_000_000_000) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
}

export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function fmtDateShort(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short",
  });
}

export const TYPE_COLORS = {
  "Short":     "#22d3ee",
  "Medium":    "#a78bfa",
  "Long-form": "#4f8ef7",
};
