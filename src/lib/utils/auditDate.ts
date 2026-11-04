/**
 * Timezone-safe date formatting utilities for audit and invoice dates.
 * Ensures consistent calendar dates across India, USA, and other timezones
 * without off-by-one errors caused by local timezone offset shifts.
 */

import {
  formatCalendarDate,
  toCalendarInputDate,
  formatPolicyDateRange,
  parseCalendarParts
} from "./dateUtils";

export {
  formatCalendarDate,
  toCalendarInputDate,
  formatPolicyDateRange,
  parseCalendarParts
};

export function formatAuditDate(dateVal: any): string {
  return formatCalendarDate(dateVal);
}

export function formatAuditDateRange(startVal: any, endVal: any): string {
  const start = formatCalendarDate(startVal);
  const end = formatCalendarDate(endVal);
  if (start && end) return `${start} - ${end}`;
  return start || end || "";
}

export function toAuditInputDate(dateVal: any): string {
  return toCalendarInputDate(dateVal);
}
