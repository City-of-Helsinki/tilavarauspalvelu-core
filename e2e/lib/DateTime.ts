/**
 * Robot Framework DateTime library keywords the suite uses, with the same names.
 * Dates are local time, so the runner must use TZ=Europe/Helsinki like the Robot Docker image did.
 */
import { argsOf, library, timeToMs } from "./robot";
import type { RobotValue } from "./robot";

/** Python's datetime as Robot's `result_format=datetime` returns it: `${date_time.hour}` etc. work. */
export class PythonDatetime {
  readonly date: Date;

  constructor(date: Date) {
    this.date = date;
  }

  get year(): number {
    return this.date.getFullYear();
  }

  get month(): number {
    return this.date.getMonth() + 1;
  }

  get day(): number {
    return this.date.getDate();
  }

  get hour(): number {
    return this.date.getHours();
  }

  get minute(): number {
    return this.date.getMinutes();
  }

  get second(): number {
    return this.date.getSeconds();
  }

  toString(): string {
    return strftime(this.date, "%Y-%m-%d %H:%M:%S");
  }
}

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

/** The strftime directives the suite uses. */
export function strftime(date: Date, format: string): string {
  return format.replaceAll(/%([YmdHMSfa%])/g, (_match, directive: string) => {
    switch (directive) {
      case "Y":
        return String(date.getFullYear());
      case "m":
        return pad(date.getMonth() + 1);
      case "d":
        return pad(date.getDate());
      case "H":
        return pad(date.getHours());
      case "M":
        return pad(date.getMinutes());
      case "S":
        return pad(date.getSeconds());
      case "f":
        return pad(date.getMilliseconds() * 1000, 6);
      case "a":
        return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()] ?? "";
      default:
        return "%";
    }
  });
}

/** Parses Robot's timestamp ("2024-05-01 12:30:00.000", "2024-05-01") or a date with a strptime format. */
export function parseDate(value: RobotValue, dateFormat?: RobotValue): Date {
  if (value instanceof PythonDatetime) {
    return new Date(value.date);
  }
  if (value instanceof Date) {
    return new Date(value);
  }
  const text = String(value).trim();
  if (dateFormat != null && dateFormat !== "") {
    const fields: Record<string, number> = { Y: 1970, m: 1, d: 1, H: 0, M: 0, S: 0 };
    const order: string[] = [];
    const pattern = String(dateFormat).replaceAll(/%([YmdHMS])|([.*+?^${}()|[\]\\])/g, (match, directive, special) => {
      if (directive != null) {
        order.push(String(directive));
        return directive === "Y" ? "(\\d{4})" : "(\\d{1,2})";
      }
      return special == null ? match : `\\${String(special)}`;
    });
    const parsed = new RegExp(`^${pattern}$`).exec(text);
    if (parsed == null) {
      throw new Error(`time data '${text}' does not match format '${String(dateFormat)}'`);
    }
    for (const [position, directive] of order.entries()) {
      fields[directive] = Number.parseInt(parsed[position + 1] ?? "0", 10);
    }
    return new Date(fields.Y ?? 1970, (fields.m ?? 1) - 1, fields.d ?? 1, fields.H ?? 0, fields.M ?? 0, fields.S ?? 0);
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?$/.exec(text);
  if (match == null) {
    throw new Error(`Invalid timestamp '${text}'`);
  }
  const [, year, month, day, hour, minute, second, fraction] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour ?? 0),
    Number(minute ?? 0),
    Number(second ?? 0),
    Math.round(Number(`0.${fraction ?? "0"}`) * 1000)
  );
}

function formatDate(date: Date, resultFormat: RobotValue, excludeMillis: RobotValue): RobotValue {
  const format = resultFormat == null || resultFormat === "" ? "timestamp" : String(resultFormat);
  if (format === "datetime") {
    return new PythonDatetime(date);
  }
  if (format === "epoch") {
    return date.getTime() / 1000;
  }
  if (format === "timestamp") {
    const base = strftime(date, "%Y-%m-%d %H:%M:%S");
    return excludeMillis === true || String(excludeMillis).toLowerCase() === "true"
      ? base
      : `${base}.${pad(date.getMilliseconds(), 3)}`;
  }
  return strftime(date, format);
}

function formatTimer(ms: number, excludeMillis: RobotValue): string {
  const sign = ms < 0 ? "-" : "";
  const total = Math.abs(ms);
  const hours = Math.floor(total / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);
  const base = `${sign}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return String(excludeMillis).toLowerCase() === "true" ? base : `${base}.${pad(total % 1000, 3)}`;
}

export const DateTime = library("DateTime", {
  "Get Current Date": (...args: RobotValue[]) => {
    const { result_format, exclude_millis } = argsOf(args, [
      "time_zone",
      "increment",
      "result_format",
      "exclude_millis",
    ]);
    return formatDate(new Date(), result_format, exclude_millis);
  },

  "Convert Date": (...args: RobotValue[]) => {
    const { date, result_format, exclude_millis, date_format } = argsOf(args, [
      "date",
      "result_format",
      "exclude_millis",
      "date_format",
    ]);
    return formatDate(parseDate(date, date_format), result_format, exclude_millis);
  },

  "Add Time To Date": (...args: RobotValue[]) => {
    const { date, time, result_format, exclude_millis, date_format } = argsOf(args, [
      "date",
      "time",
      "result_format",
      "exclude_millis",
      "date_format",
    ]);
    // Robot adds the time to the local clock time (a naive datetime), so a day stays a day across DST changes
    const start = parseDate(date, date_format);
    const result = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      start.getHours(),
      start.getMinutes(),
      start.getSeconds(),
      start.getMilliseconds() + timeToMs(time)
    );
    return formatDate(result, result_format, exclude_millis);
  },

  "Add Time To Time": (...args: RobotValue[]) => {
    const { time1, time2, result_format, exclude_millis } = argsOf(
      args,
      ["time1", "time2", "result_format", "exclude_millis"],
      {
        result_format: "number",
      }
    );
    const total = timeToMs(time1) + timeToMs(time2);
    if (String(result_format) === "timer") {
      return formatTimer(total, exclude_millis);
    }
    return total / 1000;
  },
});
