export function formatMillicores(millicores: number | null): string {
  if (millicores == null) return "—";
  if (millicores < 1000) return `${millicores}m`;
  return `${(millicores / 1000).toFixed(2)} cores`;
}

export function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  const mib = bytes / (1024 * 1024);
  if (mib < 1024) return `${mib.toFixed(0)} MiB`;
  return `${(mib / 1024).toFixed(2)} GiB`;
}

export function formatAge(createdAt: string | null): string {
  if (!createdAt) return "—";
  const ms = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
