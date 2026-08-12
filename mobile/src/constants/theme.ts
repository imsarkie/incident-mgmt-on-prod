export const colors = {
  background: "#0B1120",
  surface: "#141B2D",
  border: "#232B3E",
  text: "#E6EAF2",
  textMuted: "#8A93A6",
  primary: "#4C8DFF",

  healthy: "#31C48D",
  degraded: "#F5B942",
  down: "#F25C5C",

  minor: "#4C8DFF",
  major: "#F5B942",
  critical: "#F25C5C",

  // Kubernetes incident severities (critical/high/medium) — distinct from the fictional
  // simulator's minor/major/critical above.
  high: "#F5B942",
  medium: "#4C8DFF",

  resolved: "#31C48D",
  monitoring: "#F5B942",
  active: "#F25C5C",
} as const;

export const gradients = {
  purple: ["#7C3AED", "#4C1D95"],
  blue: ["#2563EB", "#1E3A8A"],
  green: ["#059669", "#065F46"],
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
