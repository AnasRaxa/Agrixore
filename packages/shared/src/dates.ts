/** Today's date (YYYY-MM-DD) in Pakistan. Prices and forecasts are dated in this time zone. */
export function todayInPakistan(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(now);
}

/** Adds (or subtracts) whole days to a YYYY-MM-DD date. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
