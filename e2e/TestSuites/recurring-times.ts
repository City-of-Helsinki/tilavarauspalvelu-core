/**
 * The seasonal application's selected times as the time checks write them, and as page 2 and the preview page show
 * them. A time is the weekday as the summaries shorten it, the start and the end joined with an en dash, E for an
 * Ensisijainen time or V for a Vaihtoehtoinen one, and " (liian lyhyt)" after a time shorter than the minimum length.
 *
 * e.g. "To 19:00–21:00 E" or "To 13:00–13:15 E (liian lyhyt)". The short form keeps the step titles readable.
 */
import {
  RECURRING_BOOKING_INVALID_TIME,
  RECURRING_BOOKING_PRIMARY_TIME,
  RECURRING_BOOKING_SECONDARY_TIME,
  RECURRING_BOOKING_TOO_SHORT_MARK,
  RECURRING_BOOKING_WEEKDAYS,
} from "./Resources/texts_FI";

// The application calendar's cells are 15 minutes long
export const CALENDAR_STEP_MINUTES = 15;

const SELECTED_TIME = /^(Ma|Ti|Ke|To|Pe|La|Su) (\d\d:\d\d)–(\d\d:\d\d) ([EV])( \(liian lyhyt\))?$/;

interface SelectedTime {
  /** The index of the weekday in `RECURRING_BOOKING_WEEKDAYS`, 0 for Monday */
  weekday: number;
  from: string;
  to: string;
  primary: boolean;
  tooShort: boolean;
}

/** Minutes from midnight, e.g. 1140 for "19:00" */
export function minutesOf(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Reads the selected times, in calendar order: by weekday, then by time, whatever the type */
function parseSelectedTimes(times: ReadonlyArray<string>): SelectedTime[] {
  return times
    .map((text) => {
      const match = SELECTED_TIME.exec(text);
      if (match == null) {
        throw new Error(`"${text}" is not a selected time like "To 19:00–21:00 E", with an en dash`);
      }
      const [, short_day, from = "", to = "", type, too_short] = match;
      return {
        weekday: RECURRING_BOOKING_WEEKDAYS.findIndex(([short]) => short === short_day),
        from,
        to,
        primary: type === "E",
        tooShort: too_short != null,
      };
    })
    .sort((a, b) => a.weekday - b.weekday || minutesOf(a.from) - minutesOf(b.from));
}

/** A clock time as the summaries write it: a whole hour without minutes, e.g. "9" for "09:00", but "18:45" */
function summaryClock(time: string): string {
  const [hours = "", minutes = ""] = time.split(":");
  return minutes === "00" ? String(Number(hours)) : `${Number(hours)}:${minutes}`;
}

/** A time as the summaries write it, e.g. "9–11" or "18:45–19" */
function summaryTime({ from, to }: SelectedTime): string {
  return `${summaryClock(from)}–${summaryClock(to)}`;
}

/**
 * The selected times as page 2 shows them: the items of the list of the selected times, the rows of the summary's
 * columns, a row per weekday, and the number of calendar cells they cover. A summary row reads e.g.
 * "To:9–11, 18:45–19", or only "To" when the day has no times.
 */
export function selectedTimesAsShown(times: ReadonlyArray<string>): {
  list: string[];
  primary: string[];
  secondary: string[];
  cells: number;
} {
  const parsed = parseSelectedTimes(times);
  const list = parsed.map((time) => {
    const [, weekday = ""] = RECURRING_BOOKING_WEEKDAYS[time.weekday] ?? [];
    const type = time.primary ? RECURRING_BOOKING_PRIMARY_TIME : RECURRING_BOOKING_SECONDARY_TIME;
    return `${weekday} ${time.from}–${time.to}, ${type}${time.tooShort ? RECURRING_BOOKING_TOO_SHORT_MARK : ""}`;
  });
  const column = (primary: boolean) =>
    RECURRING_BOOKING_WEEKDAYS.map(([short_day], weekday) => {
      const day_times = parsed
        .filter((time) => time.weekday === weekday && time.primary === primary)
        .map((time) => `${summaryTime(time)}${time.tooShort ? ` (${RECURRING_BOOKING_INVALID_TIME})` : ""}`);
      return day_times.length > 0 ? `${short_day}:${day_times.join(", ")}` : short_day;
    });
  const cells = parsed.reduce(
    (sum, time) => sum + (minutesOf(time.to) - minutesOf(time.from)) / CALENDAR_STEP_MINUTES,
    0
  );
  return { list, primary: column(true), secondary: column(false), cells };
}

/**
 * The sent times as the preview page shows them: a row per weekday with the day, its Ensisijaiset times, and its
 * Vaihtoehtoiset times in parentheses, or "-" for none.
 */
export function sentTimesAsPreviewed(times: ReadonlyArray<string>): string[][] {
  const parsed = parseSelectedTimes(times);
  return RECURRING_BOOKING_WEEKDAYS.map(([short_day], weekday) => {
    const day_times = (primary: boolean) =>
      parsed
        .filter((time) => time.weekday === weekday && time.primary === primary)
        .map((time) => summaryTime(time))
        .join(", ");
    const primary_times = day_times(true);
    const secondary_times = day_times(false);
    return [short_day, primary_times || "-", secondary_times ? `(${secondary_times})` : "-"];
  });
}
