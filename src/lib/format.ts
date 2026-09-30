const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const money = (n: number) => currency.format(n || 0);

/** Plain-ASCII rupee format for jsPDF, whose built-in fonts have no ₹ glyph. */
export const moneyPdf = (n: number) => `Rs. ${Math.round(n || 0).toLocaleString("en-IN")}`;

export const today = () => new Date().toISOString().slice(0, 10);

export const monthNow = () => today().slice(0, 7);

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Returns a valid YYYY-MM month from a search param, falling back to the current month. */
export function parseMonth(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return v && MONTH_RE.test(v) ? v : monthNow();
}

/** Normalises Indian numbers to the international format wa.me expects. */
export function whatsappNumber(value: string) {
  let n = (value || "").replace(/\D/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  if (n.length === 10) n = "91" + n;
  else if (n.length === 11 && n.startsWith("0")) n = "91" + n.slice(1);
  return n;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
