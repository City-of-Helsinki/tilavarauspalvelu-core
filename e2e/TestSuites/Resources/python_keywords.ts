/** Port of python_keywords.py. The functions keep their Python names. */
import { BuiltIn } from "../../lib/BuiltIn";
import { PythonDatetime } from "../../lib/DateTime";
import type { RobotValue } from "../../lib/robot";

const FINNISH_DAYS = ["Su", "Ma", "Ti", "Ke", "To", "Pe", "La"];

const describeChar = (char: string) => {
  const code = char === "" ? "N/A" : (char.codePointAt(0) ?? "N/A");
  return { char, ascii: code, hex: typeof code === "number" ? `0x${code.toString(16)}` : "N/A" };
};

interface Difference {
  position: number;
  [name: string]: number | { char: string; ascii: number | string; hex: string };
}

export const python_keywords = {
  /** The abbreviated Finnish day name of a date: "Ma", "Ti", ... (fi_FI strftime("%a").capitalize()). */
  get_finnish_day: (date_time: RobotValue): string => {
    const date: Date = date_time instanceof PythonDatetime ? date_time.date : new Date(date_time);
    return FINNISH_DAYS[date.getDay()] ?? "";
  },

  /** Compares two texts character by character and logs the differences with their code points. */
  log_differences: async (
    elementsText: RobotValue,
    expectedText: RobotValue,
    verbose: RobotValue = true,
    name1: RobotValue = "elementsText",
    name2: RobotValue = "expectedText"
  ): Promise<Difference[]> => {
    if (typeof elementsText !== "string" || typeof expectedText !== "string") {
      await BuiltIn.Log("Both inputs must be strings.", "WARN");
      return [];
    }
    if (elementsText === "" && expectedText === "") {
      await BuiltIn.Log("Both strings are empty. Nothing to compare.", "WARN");
      return [];
    }
    const differences: Difference[] = [];
    // Code points, like iterating a Python string
    // oxlint-disable-next-line typescript/no-misused-spread
    const first = [...elementsText];
    // oxlint-disable-next-line typescript/no-misused-spread
    const second = [...expectedText];
    for (let position = 0; position < Math.max(first.length, second.length); position++) {
      const char1 = first[position] ?? "";
      const char2 = second[position] ?? "";
      if (char1 !== char2) {
        const difference: Difference = {
          position,
          [String(name1)]: describeChar(char1),
          [String(name2)]: describeChar(char2),
        };
        differences.push(difference);
        if (verbose === true || String(verbose).toLowerCase() === "true") {
          // oxlint-disable-next-line no-await-in-loop -- log lines in order
          await BuiltIn.Log(`Difference found at position ${position}: ${JSON.stringify(difference)}`);
        }
      }
    }
    await BuiltIn.Log(differences.length > 0 ? `${differences.length} differences found.` : "No differences found.");
    return differences;
  },

  /** Validates a time like "Pe 13.9.2024 klo 11:45–12:45" (with an en dash). */
  validate_timeformat: (original_time: RobotValue): boolean =>
    /^[A-Za-z]{2}\s\d{1,2}\.\d{1,2}\.\d{4}\sklo\s\d{2}[:.]\d{2}–\d{2}[:.]\d{2}$/.test(String(original_time)),

  /** Extracts the time after the first delimiter found ("klo", "–" or "-"). */
  extract_time: (string: string, delimiters: string[]): string => {
    let index = -1;
    let delimiterFound = "";
    for (const delimiter of delimiters) {
      index = string.indexOf(delimiter);
      if (index !== -1) {
        delimiterFound = delimiter;
        break;
      }
    }
    if (index === -1) {
      throw new Error(`None of the delimiters ${JSON.stringify(delimiters)} found in '${string}'`);
    }
    const offset = delimiterFound === "klo" ? 3 : 1;
    const time = string.slice(index + offset, index + offset + 5);
    if (!/^\d{1,2}[:.]\d{2}$/.test(time)) {
      throw new Error(`Invalid time format found: '${time}'`);
    }
    return time;
  },

  /** "10.30" -> "103000" */
  format_time_to_ics: (time_string: string): string =>
    python_keywords.pad_time_string(time_string.replaceAll(/\D/g, "")),

  pad_time_string: (time_string: string): string => {
    const padded = time_string.length === 3 ? `0${time_string}` : time_string;
    return `${padded.slice(0, 2)}${padded.slice(2, 4)}00`;
  },

  /** "1.10.2024" -> "20241001" */
  format_date_to_ics: (date_string: string): string => {
    if (!/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(date_string)) {
      throw new Error(`Invalid date format: ${date_string}`);
    }
    const [day = "", month = "", year = ""] = date_string.split(".");
    return `${year}${python_keywords.pad_with_leading_zero(month)}${python_keywords.pad_with_leading_zero(day)}`;
  },

  pad_with_leading_zero: (value: string): string => value.padStart(2, "0"),

  convert_to_ics_datetime: (date: string, time: string): string => `${date}T${time}`,

  /**
   * "Ti 1.10.2024 klo 10.30 – 11.30" ->
   * ["DTSTART;TZID=Europe/Helsinki:20241001T103000", "DTEND;TZID=Europe/Helsinki:20241001T113000"]
   */
  convert_booking_time_to_ics: (time_string: RobotValue): [string, string] => {
    const text = String(time_string);
    const trimmed = text.replaceAll(" ", "");
    const dateMatch = /\b(\d{1,2}\.\d{1,2}\.\d{4})\b/.exec(text);
    if (dateMatch == null) {
      throw new Error("Date format not found in input string.");
    }
    const startTime = python_keywords.extract_time(trimmed, ["klo"]);
    const endTime = python_keywords.extract_time(trimmed, ["–", "-"]);
    const date = python_keywords.format_date_to_ics(dateMatch[1] ?? "");
    const start = python_keywords.convert_to_ics_datetime(date, python_keywords.format_time_to_ics(startTime));
    const end = python_keywords.convert_to_ics_datetime(date, python_keywords.format_time_to_ics(endTime));
    const timezoneId = "Europe/Helsinki";
    return [`DTSTART;TZID=${timezoneId}:${start}`, `DTEND;TZID=${timezoneId}:${end}`];
  },
};
