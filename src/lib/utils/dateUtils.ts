/**
 * Centralized calendar date utilities to ensure 100% timezone-independent date handling.
 * Prevents 1-day shifts between US, India, Europe, etc. caused by local timezone offsets
 * or Daylight Saving Time changes.
 */

export interface CalendarParts {
  year: number;
  month: number;
  day: number;
}

/**
 * Extracts the calendar year, month (1-12), and day (1-31) from any date format
 * (YYYY-MM-DD, ISO string, MM/DD/YYYY, or Date object) without timezone conversion shifts.
 */
export function parseCalendarParts(dateVal: any): CalendarParts | null {
  if (!dateVal) return null;

  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    if (!trimmed) return null;

    // Case 1: ISO string or YYYY-MM-DD (e.g. "2026-11-04", "2026-11-04T00:00:00.000Z")
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return {
        year: parseInt(isoMatch[1], 10),
        month: parseInt(isoMatch[2], 10),
        day: parseInt(isoMatch[3], 10),
      };
    }

    // Case 2: MM/DD/YYYY or M/D/YYYY (e.g. "11/04/2026", "11/4/2026")
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      return {
        year: parseInt(slashMatch[3], 10),
        month: parseInt(slashMatch[1], 10),
        day: parseInt(slashMatch[2], 10),
      };
    }
  }

  // Case 3: Date object or timestamp
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;

  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

/**
 * Formats a date as MM/DD/YYYY (2-digit month, 2-digit day, 4-digit year)
 * preserving the exact calendar day across all timezones.
 */
export function formatCalendarDate(dateVal: any): string {
  const parts = parseCalendarParts(dateVal);
  if (!parts) return "";
  const mm = String(parts.month).padStart(2, "0");
  const dd = String(parts.day).padStart(2, "0");
  return `${mm}/${dd}/${parts.year}`;
}

/**
 * Adds N years to a calendar date, preserving the exact same month and day.
 * (Handles leap year: Feb 29 + 1 year -> Feb 28).
 */
export function addYearsToCalendarDate(dateVal: any, years = 1): string {
  const parts = parseCalendarParts(dateVal);
  if (!parts) return "";
  const targetYear = parts.year + years;
  let day = parts.day;
  if (parts.month === 2 && day === 29) {
    const isLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
    if (!isLeap) day = 28;
  }
  const mm = String(parts.month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${mm}/${dd}/${targetYear}`;
}

/**
 * Adds N months to a calendar date.
 */
export function addMonthsToCalendarDate(dateVal: any, months = 6): string {
  const parts = parseCalendarParts(dateVal);
  if (!parts) return "";
  let targetMonth = parts.month + months;
  let targetYear = parts.year;
  while (targetMonth > 12) {
    targetMonth -= 12;
    targetYear += 1;
  }
  let day = parts.day;
  const daysInMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  if (day > daysInMonth) day = daysInMonth;
  const mm = String(targetMonth).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${mm}/${dd}/${targetYear}`;
}

/**
 * Converts a date into "YYYY-MM-DD" format suitable for HTML `<input type="date">`.
 */
export function toCalendarInputDate(dateVal: any): string {
  const parts = parseCalendarParts(dateVal);
  if (!parts) return "";
  const mm = String(parts.month).padStart(2, "0");
  const dd = String(parts.day).padStart(2, "0");
  return `${parts.year}-${mm}-${dd}`;
}

/**
 * Calculates the expiration date as YYYY-MM-DD from an effective date and duration.
 */
export function calculateExpirationDate(effVal: any, duration: "1year" | "6months" | string = "1year"): string {
  const parts = parseCalendarParts(effVal);
  if (!parts) return "";

  if (duration === "6months") {
    const formatted = addMonthsToCalendarDate(effVal, 6);
    return toCalendarInputDate(formatted);
  }

  const formatted = addYearsToCalendarDate(effVal, 1);
  return toCalendarInputDate(formatted);
}

/**
 * Formats a policy effective and expiration date range as:
 * "MM/DD/YYYY - MM/DD/YYYY"
 * If expiration date is missing, automatically computes it from effective date and duration.
 */
export function formatPolicyDateRange(
  effVal: any,
  expVal: any,
  duration: "1year" | "6months" | string = "1year"
): string {
  const effFormatted = formatCalendarDate(effVal);
  if (!effFormatted) return "TBD";

  let expFormatted = formatCalendarDate(expVal);
  if (!expFormatted) {
    expFormatted = duration === "6months"
      ? addMonthsToCalendarDate(effVal, 6)
      : addYearsToCalendarDate(effVal, 1);
  }

  return `${effFormatted} - ${expFormatted}`;
}

