/** Robot Framework String library keywords the suite uses, with the same names. */
import { argsOf, library } from "./robot";
import type { RobotValue } from "./robot";

/** Python's str.split(separator, max_split). Without a separator it splits on whitespace runs. */
export function pythonSplit(text: string, separator: RobotValue, maxSplit: number): string[] {
  if (separator == null || separator === "") {
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    if (maxSplit < 0 || words.length <= maxSplit + 1) {
      return words;
    }
    // Keep the remainder with its original spacing, like Python
    const result: string[] = [];
    let rest = text.trimStart();
    for (let index = 0; index < maxSplit; index++) {
      const match = /^(\S+)\s+/.exec(rest);
      if (match == null) {
        break;
      }
      result.push(match[1] ?? "");
      rest = rest.slice(match[0].length);
    }
    result.push(rest.trimEnd());
    return result;
  }
  const parts = text.split(String(separator));
  if (maxSplit < 0 || parts.length <= maxSplit + 1) {
    return parts;
  }
  return [...parts.slice(0, maxSplit), parts.slice(maxSplit).join(String(separator))];
}

function stripCharacters(text: string, mode: string, characters: RobotValue): string {
  if (characters == null || characters === "") {
    if (mode === "left") {
      return text.trimStart();
    }
    return mode === "right" ? text.trimEnd() : text.trim();
  }
  const set = new Set(String(characters));
  let start = 0;
  let end = text.length;
  if (mode !== "right") {
    while (start < end && set.has(text[start] ?? "")) {
      start++;
    }
  }
  if (mode !== "left") {
    while (end > start && set.has(text[end - 1] ?? "")) {
      end--;
    }
  }
  return text.slice(start, end);
}

/** Converts a Python regex to JavaScript. The suite's patterns only need the (?i) flag handled. */
export function pythonRegExp(pattern: RobotValue, flags = ""): RegExp {
  let source = String(pattern);
  let allFlags = flags;
  if (source.startsWith("(?i)")) {
    source = source.slice(4);
    allFlags += "i";
  }
  return new RegExp(source, allFlags);
}

export const String_ = library("String", {
  "Replace String": (...args: RobotValue[]) => {
    const { string, search_for, replace_with, count } = argsOf(
      args,
      ["string", "search_for", "replace_with", "count"],
      {
        count: -1,
      }
    );
    const limit = Number(count);
    if (limit < 0) {
      return String(string).replaceAll(String(search_for), String(replace_with));
    }
    let result = String(string);
    for (let index = 0; index < limit; index++) {
      result = result.replace(String(search_for), String(replace_with));
    }
    return result;
  },

  "Replace String Using Regexp": (...args: RobotValue[]) => {
    const { string, pattern, replace_with, count } = argsOf(args, ["string", "pattern", "replace_with", "count"], {
      count: -1,
    });
    const limit = Number(count);
    const replacement = String(replace_with).replaceAll(/\\(\d)/g, "$$$1");
    if (limit < 0) {
      return String(string).replace(pythonRegExp(pattern, "g"), replacement);
    }
    let result = String(string);
    for (let index = 0; index < limit; index++) {
      result = result.replace(pythonRegExp(pattern), replacement);
    }
    return result;
  },

  "Strip String": (...args: RobotValue[]) => {
    const { string, mode, characters } = argsOf(args, ["string", "mode", "characters"], { mode: "both" });
    return stripCharacters(String(string), String(mode).toLowerCase(), characters);
  },

  "Split String": (...args: RobotValue[]) => {
    const { string, separator, max_split } = argsOf(args, ["string", "separator", "max_split"], { max_split: -1 });
    return pythonSplit(String(string), separator, Number(max_split));
  },

  "Fetch From Left": (string: RobotValue, marker: RobotValue) => {
    const text = String(string);
    const index = text.indexOf(String(marker));
    return index === -1 ? text : text.slice(0, index);
  },

  "Get Substring": (string: RobotValue, start: RobotValue, end?: RobotValue) => {
    const text = String(string);
    return end == null || end === "" ? text.slice(Number(start)) : text.slice(Number(start), Number(end));
  },

  "Get Regexp Matches": (string: RobotValue, pattern: RobotValue) =>
    [...String(string).matchAll(pythonRegExp(pattern, "g"))].map((match) => match[0]),

  "Remove String": (string: RobotValue, ...removables: RobotValue[]) => {
    let text = String(string);
    for (const removable of removables) {
      text = text.replaceAll(String(removable), "");
    }
    return text;
  },

  "Convert To Lowercase": (string: RobotValue) => String(string).toLowerCase(),

  "Generate Random String": (...args: RobotValue[]) => {
    const { length, chars } = argsOf(args, ["length", "chars"], { length: 8, chars: "[LETTERS][NUMBERS]" });
    const alphabet = String(chars)
      .replaceAll("[LOWER]", "abcdefghijklmnopqrstuvwxyz")
      .replaceAll("[UPPER]", "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
      .replaceAll("[LETTERS]", "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
      .replaceAll("[NUMBERS]", "0123456789");
    let result = "";
    for (let index = 0; index < Number(length); index++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "";
    }
    return result;
  },
});
