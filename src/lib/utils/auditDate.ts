/**
 * Timezone-safe date formatting utilities for audit and invoice dates.
 * Ensures consistent calendar dates across India, USA, and other timezones
 * without off-by-one errors caused by local timezone offset shifts.
 */

export function formatAuditDate(dateVal: any): string {
  if (!dateVal) return "";

  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    // Case 1: Already MM/DD/YYYY or M/D/YYYY
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      return `${parseInt(slashMatch[1], 10)}/${parseInt(slashMatch[2], 10)}/${slashMatch[3]}`;
    }
    // Case 2: ISO string or YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${parseInt(isoMatch[2], 10)}/${parseInt(isoMatch[3], 10)}/${isoMatch[1]}`;
    }
  }

  // Case 3: Date object or object with toISOString
  if (dateVal instanceof Date || (typeof dateVal === "object" && dateVal && typeof (dateVal as any).toISOString === "function")) {
    try {
      const iso = (dateVal as any).toISOString();
      const isoMatch = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        return `${parseInt(isoMatch[2], 10)}/${parseInt(isoMatch[3], 10)}/${isoMatch[1]}`;
      }
    } catch {
      // ignore
    }
  }

  // Fallback using UTC timezone
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { timeZone: "UTC" });
}

export function formatAuditDateRange(startVal: any, endVal: any): string {
  const start = formatAuditDate(startVal);
  const end = formatAuditDate(endVal);
  if (start && end) return `${start} - ${end}`;
  return start || end || "";
}

export function toAuditInputDate(dateVal: any): string {
  if (!dateVal) return "";
  if (typeof dateVal === "string") {
    const isoMatch = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return isoMatch[0];
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

