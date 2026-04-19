import { endOfDay, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const TZ = "Europe/Amsterdam";

/** Start en einde (exclusief volgende middernacht) van de kalenderdag in Amsterdam, als ISO UTC. */
export function amsterdamDayRangeIso(now = new Date()): { start: string; end: string } {
  const zoned = toZonedTime(now, TZ);
  const startLocal = startOfDay(zoned);
  const endLocal = endOfDay(zoned);
  const start = fromZonedTime(startLocal, TZ);
  const end = fromZonedTime(endLocal, TZ);
  return { start: start.toISOString(), end: end.toISOString() };
}
