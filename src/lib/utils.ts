export function formatDistanceToNow(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 7) return `hace ${days}d`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  // `YYYY-MM-DD` from <input type="date"> must be treated as local calendar date.
  // Using `new Date("YYYY-MM-DD")` parses as UTC and can render one day earlier.
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const parsed = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      )
    : new Date(dateStr);

  return parsed.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
