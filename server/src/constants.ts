export const PRIORITY_KEYS = ["IMMEDIATE", "HIGH", "MEDIUM", "LOW"] as const;
export const SEVERITY_KEYS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export const STATUS_KEYS = ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSE", "REOPEN", "ON_HOLD"] as const;

export type PriorityKey = (typeof PRIORITY_KEYS)[number];
export type SeverityKey = (typeof SEVERITY_KEYS)[number];
export type StatusKey = (typeof STATUS_KEYS)[number];

export function parseIntParam(val: unknown): number | null {
  if (typeof val !== "string") return null;
  const n = Number.parseInt(val, 10);
  return Number.isFinite(n) ? n : null;
}
