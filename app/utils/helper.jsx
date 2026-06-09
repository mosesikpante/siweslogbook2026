// ─── UTILS ──────────────────────────────────────────────────
export const fmt = (d) => d ? new Date(d).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const initials = (name) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "??";
export const weekNum = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
};
export const getWeekRange = (entries) => {
  if (!entries.length) return { start: "", end: "" };
  const dates = entries.map(e => new Date(e.entry_date)).sort((a, b) => a - b);
  return { start: dates[0].toISOString().split("T")[0], end: dates[dates.length - 1].toISOString().split("T")[0] };
};
