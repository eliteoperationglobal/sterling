/**
 * Currency formatting helpers used across forms and quoting pages.
 *
 * IMPORTANT:
 * - `formatCurrency` intentionally returns a number string WITHOUT "$"
 *   because many inputs render the "$" as a separate prefix element.
 */

/**
 * Parse a currency-like input into a number.
 * Accepts values like "1,234.56", "$1,234.56", "1234", "".
 */
export function parseCurrency(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0;
  if (typeof input === "number") return Number.isFinite(input) ? input : 0;

  const raw = String(input).trim();
  if (!raw) return 0;

  // Keep digits, minus, and dot. Remove commas, spaces, currency symbols, etc.
  const normalized = raw.replace(/[^\d.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Format a number as a currency-like string WITHOUT the "$" symbol.
 * Example: 1234.5 -> "1,234.50"
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return safe.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format user input while typing (adds thousands separators, preserves partial decimals).
 * Example: "1234" -> "1,234"
 * Example: "1234.5" -> "1,234.5"
 * Example: "$1,234.56" -> "1,234.56"
 */
export function formatCurrencyInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (!str.trim()) return "";

  // Remove everything except digits and dot (we don't expect negatives in these inputs).
  const cleaned = str.replace(/[^\d.]/g, "");
  if (!cleaned) return "";

  const parts = cleaned.split(".");
  const integerRaw = parts[0] ?? "";
  const decimalRaw = parts.length > 1 ? parts.slice(1).join("") : "";

  // Strip leading zeros unless the value is exactly "0" or starts with "0."
  const integerDigits = integerRaw.replace(/^0+(?=\d)/, "");

  // Add commas to integer part.
  const integerWithCommas = integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Preserve up to 2 decimal digits while typing.
  if (parts.length > 1) {
    const dec = decimalRaw.slice(0, 2);
    return `${integerWithCommas || "0"}.${dec}`;
  }

  return integerWithCommas;
}

