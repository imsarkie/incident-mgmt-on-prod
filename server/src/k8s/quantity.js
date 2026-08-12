// Kubernetes resource quantities are strings like "100m", "1", "23153742n", "128Mi".
// This parses the suffix into a plain number so the rest of the backend never has to
// think about Kubernetes' unit conventions.
const SUFFIX_MULTIPLIERS = {
  n: 1e-9,
  u: 1e-6,
  m: 1e-3,
  "": 1,
  k: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  Ki: 2 ** 10,
  Mi: 2 ** 20,
  Gi: 2 ** 30,
  Ti: 2 ** 40,
};

function parseQuantity(value) {
  if (value == null) return 0;
  const match = String(value)
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)([a-zA-Z]*)$/);
  if (!match) return 0;
  const [, numStr, suffix] = match;
  const multiplier = SUFFIX_MULTIPLIERS[suffix];
  if (multiplier === undefined) return 0;
  return parseFloat(numStr) * multiplier;
}

export function parseCpuMillicores(value) {
  return Math.round(parseQuantity(value) * 1000);
}

export function parseMemoryBytes(value) {
  return Math.round(parseQuantity(value));
}
