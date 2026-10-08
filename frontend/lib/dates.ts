// Dates are kept as "YYYY-MM-DD" strings everywhere, which avoids timezone bugs
export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const nightsBetween = (a: string, b: string) =>
  Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);

export const fmt = (s: string) =>
  parse(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });