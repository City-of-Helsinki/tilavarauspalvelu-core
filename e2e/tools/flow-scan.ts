/**
 * Reads the flow of the ported tests and keywords from their TypeScript source, for the parity check:
 * the keyword calls and references (`module["Keyword"]`, `Browser["Click"]`, `python_keywords.fn(...)`) in order,
 * the variables each call's arguments use, and the `V.X = ...` assignments of Set Test/Suite Variable.
 */

export interface FlowStep {
  call?: string;
  set?: string;
  vars?: string[] | null;
}

export interface ScannedKeyword {
  flow: FlowStep[];
  defaults: Map<string, string>;
  documentation: string;
}

interface StringToken {
  start: number;
  end: number;
  value: string;
}

interface Located {
  at: number;
  step: FlowStep;
}

interface Mark {
  kind: string;
  at: number;
  title: string;
}

interface Masked {
  code: string;
  strings: StringToken[];
}

/** The TypeScript names of the Robot libraries */
export const LIBRARIES: Record<string, string> = {
  Browser: "Browser",
  BuiltIn: "BuiltIn",
  String_: "String",
  Collections: "Collections",
  DateTime: "DateTime",
  OperatingSystem: "OperatingSystem",
  PabotLib: "PabotLib",
  RequestsLibrary: "RequestsLibrary",
};

const PYTHON_LIBRARIES = ["python_keywords", "robot_email_test_tool"];

const NOT_VARIABLES = new Set([
  "await",
  "async",
  "new",
  "typeof",
  "true",
  "false",
  "null",
  "undefined",
  "import",
  "named",
  "namedOnly",
  "str",
  "chain",
  "isTruthy",
  "pyBool",
  "errorMessage",
  "testInfo",
  "strftime",
  "parseDate",
  "String",
  "Number",
  "Boolean",
  "Math",
  "Date",
  "JSON",
  "Object",
  "Array",
  "RobotValue",
  "V",
  ...PYTHON_LIBRARIES,
  ...Object.keys(LIBRARIES),
]);

/** Robot ignores case, spaces and underscores; the port turns "-" into "_" and may add "_" to avoid clashes. */
export const normalizeVariable = (name: string) => name.replaceAll(/[\s_$-]/g, "").toLowerCase();

function decodeString(raw: string, quote: string): string {
  const json = quote === "'" ? raw.replaceAll("\\'", "'").replaceAll(/(?<!\\)"/g, '\\"') : raw;
  try {
    return JSON.parse(`"${json}"`) as string;
  } catch {
    return raw;
  }
}

/** The code with string contents, comments and regex literals blanked out, plus the string literals. */
function mask(source: string): Masked {
  const chars: string[] = [];
  for (let position = 0; position < source.length; position++) {
    chars.push(source.charAt(position));
  }
  const strings: StringToken[] = [];
  const blank = (from: number, to: number) => {
    for (let position = from; position < to; position++) {
      if (chars[position] !== "\n") {
        chars[position] = " ";
      }
    }
  };
  // Open ${...} expressions of template literals, by their brace depth
  const templates: number[] = [];
  let index = 0;
  let lastCode = "";
  while (index < source.length) {
    const char = source.charAt(index);
    const next = source.charAt(index + 1);
    if (char === "/" && next === "/") {
      const end = source.indexOf("\n", index);
      const stop = end === -1 ? source.length : end;
      blank(index, stop);
      index = stop;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2) + 2;
      blank(index, end);
      index = end;
      continue;
    }
    if (char === '"' || char === "'") {
      let end = index + 1;
      while (end < source.length && source.charAt(end) !== char) {
        end += source.charAt(end) === "\\" ? 2 : 1;
      }
      strings.push({ start: index, end: end + 1, value: decodeString(source.slice(index + 1, end), char) });
      blank(index + 1, end);
      index = end + 1;
      lastCode = char;
      continue;
    }
    if (char === "`" || (char === "}" && templates.length > 0 && templates.at(-1) === 0)) {
      // A template literal, or its text after a ${...} expression
      if (char === "}") {
        templates.pop();
      }
      let end = index + 1;
      while (
        end < source.length &&
        source.charAt(end) !== "`" &&
        !(source.charAt(end) === "$" && source.charAt(end + 1) === "{")
      ) {
        end += source.charAt(end) === "\\" ? 2 : 1;
      }
      blank(index + 1, end);
      if (source.charAt(end) === "$") {
        templates.push(0);
        index = end + 2;
      } else {
        index = end + 1;
      }
      lastCode = "`";
      continue;
    }
    if (templates.length > 0 && (char === "{" || char === "}")) {
      templates[templates.length - 1] = (templates.at(-1) ?? 0) + (char === "{" ? 1 : -1);
    }
    if (char === "/" && (lastCode === "" || "(,=:[!&|?{};".includes(lastCode))) {
      // A regex literal
      let end = index + 1;
      let inClass = false;
      while (end < source.length && (source.charAt(end) !== "/" || inClass)) {
        if (source.charAt(end) === "\\") {
          end += 2;
          continue;
        }
        if (source.charAt(end) === "[") {
          inClass = true;
        } else if (source.charAt(end) === "]") {
          inClass = false;
        }
        end++;
      }
      blank(index + 1, end);
      index = end + 1;
      lastCode = "/";
      continue;
    }
    if (!/\s/.test(char)) {
      lastCode = char;
    }
    index++;
  }
  return { code: chars.join(""), strings };
}

function matching(code: string, open: number): number {
  let depth = 0;
  for (let index = open; index < code.length; index++) {
    const char = code.charAt(index);
    if (char === "(" || char === "[" || char === "{") {
      depth++;
    } else if (char === ")" || char === "]" || char === "}") {
      depth--;
      if (depth === 0) {
        return index;
      }
    }
  }
  return code.length;
}

/** Variables used in a call's argument code (strings and comments already blanked). */
function variablesIn(argumentCode: string, modules: Set<string>): string[] {
  let code = argumentCode;
  const names: string[] = [];
  // Robot variables (V.X) and built-in variables (robot.TEST_NAME), and spread arguments (...args)
  code = code.replaceAll("...", "   ");
  for (const match of code.matchAll(/(?<![\w$.])(?:V|robot)\.([A-Za-z_$][\w$]*)/g)) {
    names.push(normalizeVariable(match[1] ?? ""));
  }
  for (const match of code.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)(?![\w$])(?!\s*:(?!:))/g)) {
    const name = match[1] ?? "";
    // `$` alone is the start of a template literal's ${...}
    if (NOT_VARIABLES.has(name) || modules.has(name) || name === "robot" || normalizeVariable(name) === "") {
      continue;
    }
    names.push(normalizeVariable(name));
  }
  return names.toSorted();
}

/** The flow steps in [start, end) of a masked source. */
function flowIn(masked: Masked, start: number, end: number, modules: Set<string>): FlowStep[] {
  const found: Located[] = [];
  const { code, strings } = masked;
  for (const token of strings) {
    const close = token.end + (/^\s*/.exec(code.slice(token.end))?.[0].length ?? 0);
    if (token.start < start || token.start >= end || code.charAt(close) !== "]") {
      continue;
    }
    const reference = /([A-Za-z_$][\w$]*)\[\s*$/.exec(code.slice(Math.max(0, token.start - 60), token.start));
    const identifier = reference?.[1] ?? "";
    if (!modules.has(identifier)) {
      continue; // item access like click_result["success"], not a keyword
    }
    const rest = code.slice(close + 1);
    let vars: string[] = [];
    if (/^\s*\(/.test(rest)) {
      const open = close + 1 + rest.indexOf("(");
      vars = variablesIn(code.slice(open + 1, matching(code, open)), modules);
    }
    found.push({ at: token.start, step: { call: `${LIBRARIES[identifier] ?? identifier}.${token.value}`, vars } });
  }
  const region = code.slice(start, end);
  for (const match of region.matchAll(/(?<![\w$.])(python_keywords|robot_email_test_tool)\.(\w+)\s*\(/g)) {
    const open = start + (match.index ?? 0) + match[0].length - 1;
    found.push({
      at: start + (match.index ?? 0),
      step: { call: `${match[1]}.${match[2]}`, vars: variablesIn(code.slice(open + 1, matching(code, open)), modules) },
    });
  }
  for (const match of region.matchAll(/(?<![\w$.])V(?:\.([A-Za-z_$][\w$]*)|\[[^\]]*\])\s*=(?!=)/g)) {
    found.push({ at: start + (match.index ?? 0), step: { set: match[1] == null ? "*" : normalizeVariable(match[1]) } });
  }
  return found.toSorted((a, b) => a.at - b.at).map((entry) => entry.step);
}

/** The keywords of a generated module: flow, parameter defaults and documentation. */
export function scanModule(source: string, modules: Set<string>): Map<string, ScannedKeyword> {
  const masked = mask(source);
  const objectStart = source.indexOf("= keywords(");
  const keys = [...source.matchAll(/^ {2}("(?:[^"\\]|\\.)*"):\s/gm)]
    .filter((match) => (match.index ?? 0) > objectStart)
    .map((match) => ({ name: JSON.parse(match[1] ?? '""') as string, at: match.index ?? 0 }));
  const objectEnd = source.lastIndexOf("\n});");
  const result = new Map<string, ScannedKeyword>();
  for (const [index, key] of keys.entries()) {
    const end = keys[index + 1]?.at ?? (objectEnd === -1 ? source.length : objectEnd);
    const open = masked.code.indexOf("(", key.at);
    const close = matching(masked.code, open);
    const defaults = new Map<string, string>();
    for (const parameter of splitTopLevel(source.slice(open + 1, close))) {
      const match = /^\s*(?:\.\.\.)?([\w$]+)\s*(?::\s*[\w$[\]]+)?\s*(?:=\s*([\s\S]+))?$/.exec(parameter);
      if (match?.[2] != null) {
        defaults.set(match[1] ?? "", match[2].trim());
      }
    }
    const previous = index === 0 ? objectStart : (keys[index - 1]?.at ?? 0);
    const gap = source.slice(previous, key.at);
    const lastEnd = gap.lastIndexOf("\n  },");
    const ownGap = lastEnd === -1 ? gap : gap.slice(lastEnd);
    const docStart = ownGap.lastIndexOf("/**");
    const docEnd = ownGap.lastIndexOf("*/");
    let documentation = "";
    if (docStart !== -1 && docEnd > docStart) {
      documentation = ownGap
        .slice(docStart + 3, docEnd)
        .split("\n")
        .map((line) => line.replace(/^\s*\* ?/, ""))
        .join("\n")
        .replaceAll("*\\/", "*/")
        .trim();
    }
    result.set(key.name, { flow: flowIn(masked, close, end, modules), defaults, documentation });
  }
  return result;
}

function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  let quote: string | null = null;
  for (let index = 0; index < text.length; index++) {
    const char = text.charAt(index);
    if (quote != null) {
      quote = char === quote ? null : quote;
    } else if (char === '"' || char === "'" || char === "`") {
      quote = char;
    } else if ("([{".includes(char)) {
      depth++;
    } else if (")]}".includes(char)) {
      depth--;
    } else if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim() !== "") {
    parts.push(current);
  }
  return parts;
}

export interface ScannedSpec {
  tests: Map<string, FlowStep[]>;
  beforeEach: string | undefined;
  afterEach: string | undefined;
}

/** The tests of a generated spec (flow by title) and the first keyword of each hook. */
export function scanSpec(source: string, modules: Set<string>): ScannedSpec {
  const masked = mask(source);
  const marks: Mark[] = [];
  for (const match of masked.code.matchAll(/(?<![\w$.])test(\.beforeEach|\.afterEach)?\s*\(/g)) {
    const at = match.index ?? 0;
    const title = match[1] == null ? (masked.strings.find((token) => token.start > at)?.value ?? "") : "";
    marks.push({ kind: match[1] == null ? "test" : match[1].slice(1), at, title });
  }
  const tests = new Map<string, FlowStep[]>();
  const hooks = new Map<string, string | undefined>();
  for (const [index, mark] of marks.entries()) {
    const flow = flowIn(masked, mark.at, marks[index + 1]?.at ?? source.length, modules);
    if (mark.kind === "test") {
      tests.set(mark.title, flow);
    } else {
      hooks.set(mark.kind, flow[0]?.call);
    }
  }
  return { tests, beforeEach: hooks.get("beforeEach"), afterEach: hooks.get("afterEach") };
}
