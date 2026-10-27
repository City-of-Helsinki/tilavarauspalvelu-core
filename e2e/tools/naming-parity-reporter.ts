/**
 * Checks that the suite keeps every Robot name: suites, tests, tags, test documentation, keywords, keyword arguments
 * and variables, against tools/naming-manifest.json, a record of the tilavarauspalvelu-robot suite.
 *
 * Run with `pnpm parity` (playwright test --list --reporter ./tools/naming-parity-reporter.ts).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { FullResult, Reporter, Suite } from "@playwright/test/reporter";
import { KEYWORD_REGISTRY, V } from "../lib/robot";

interface ManifestArgument {
  robot: string;
  name: string;
  default: string | null;
  kind: string;
}

interface ManifestTest {
  name: string;
  tags: string[];
  documentation: string;
}

interface ManifestSuite {
  file: string;
  name: string;
  documentation: string;
  test_tags: string[];
  tests: ManifestTest[];
}

interface ManifestKeyword {
  file: string;
  module: string;
  name: string;
  arguments: ManifestArgument[];
}

interface ManifestVariable {
  file: string;
  module: string;
  name: string;
  values: string[];
}

const collapse = (text: string) => text.replaceAll(/\s+/g, " ").trim();

/** The value a variable file line gives, when it is a plain literal (null when it uses other variables). */
function literalValue(values: string[]): unknown {
  if (values.length !== 1) {
    return null;
  }
  const [value = ""] = values;
  const constant = /^\$\{(TRUE|FALSE|EMPTY|NONE)\}$/.exec(value)?.[1];
  if (constant != null) {
    return { TRUE: true, FALSE: false, EMPTY: "", NONE: null }[constant];
  }
  return value.includes("${") || value.includes("\\") ? null : value;
}

interface Manifest {
  source: { repository: string; commit: string };
  suites: ManifestSuite[];
  keywords: ManifestKeyword[];
  variables: ManifestVariable[];
}

const E2E_ROOT = join(import.meta.dirname, "..");

/** Parameter names of a keyword implementation, read from its source. */
function parameterNames(source: string): string[] {
  // `async x => ...` (one parameter, no parentheses after transpiling) or `async (a, b = "1") => ...`
  const head = /^\s*(?:async\s*)?(?:function\s*[\w$]*\s*)?([\w$]+)\s*=>/.exec(source);
  if (head != null) {
    return [head[1] ?? ""];
  }
  const start = source.indexOf("(");
  let depth = 0;
  let end = start;
  let quote: string | null = null;
  for (let index = start; index < source.length; index++) {
    const char = source[index] ?? "";
    if (quote != null) {
      if (char === quote && source[index - 1] !== "\\") {
        quote = null;
      }
    } else if (char === '"' || char === "'" || char === "`") {
      quote = char;
    } else if (char === "(" || char === "[" || char === "{") {
      depth++;
    } else if (char === ")" || char === "]" || char === "}") {
      depth--;
      if (depth === 0) {
        end = index;
        break;
      }
    }
  }
  const list = source.slice(start + 1, end);
  const names: string[] = [];
  let current = "";
  depth = 0;
  quote = null;
  for (const char of list) {
    if (quote != null) {
      quote = char === quote ? null : quote;
    } else if (char === '"' || char === "'" || char === "`") {
      quote = char;
    } else if ("([{".includes(char)) {
      depth++;
    } else if (")]}".includes(char)) {
      depth--;
    } else if (char === "," && depth === 0) {
      names.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim() !== "") {
    names.push(current);
  }
  return names.map((name) => /^\s*(?:\.\.\.)?([\w$]+)/.exec(name)?.[1] ?? name.trim());
}

class NamingParityReporter implements Reporter {
  private readonly problems: string[] = [];
  private readonly notes: string[] = [];
  private checked = { tests: 0, keywords: 0, variables: 0 };

  private readonly manifest = JSON.parse(
    readFileSync(join(E2E_ROOT, "tools/naming-manifest.json"), "utf8")
  ) as Manifest;

  onBegin(_config: unknown, suite: Suite): void {
    this.checkTests(this.manifest, suite);
  }

  private checkTests(manifest: Manifest, suite: Suite): void {
    const ported = new Map<string, { describe: string; tags: string[]; documentation: string[] }>();
    for (const test of suite.allTests()) {
      const file = test.location.file.replaceAll("\\", "/");
      const match = /\/TestSuites\/(.+)\.spec\.ts$/.exec(file);
      if (match == null) {
        continue;
      }
      const key = `${match[1]}.robot :: ${test.title}`;
      if (ported.has(key)) {
        continue; // the same test in several projects
      }
      ported.set(key, {
        describe: test.parent.title,
        tags: test.tags.map((tag) => tag.replace(/^@/, "")),
        documentation: test.annotations
          .filter((annotation) => annotation.type === "Documentation")
          .map((annotation) => collapse(annotation.description ?? "")),
      });
    }
    for (const robotSuite of manifest.suites) {
      for (const robotTest of robotSuite.tests) {
        const key = `${robotSuite.file} :: ${robotTest.name}`;
        const port = ported.get(key);
        this.checked.tests++;
        if (port == null) {
          this.problems.push(`Test missing: ${key}`);
          continue;
        }
        ported.delete(key);
        if (port.describe !== robotSuite.name) {
          this.problems.push(`Suite name of ${key}: "${port.describe}" should be "${robotSuite.name}"`);
        }
        const wanted = [...new Set([...robotSuite.test_tags, ...robotTest.tags])].toSorted();
        const actual = [...new Set(port.tags)].toSorted();
        if (wanted.join(",") !== actual.join(",")) {
          this.problems.push(`Tags of ${key}: [${actual.join(", ")}] should be [${wanted.join(", ")}]`);
        }
        // The suite's and the test's [Documentation] are the test's Documentation annotations
        const docs = [robotSuite.documentation, robotTest.documentation]
          .filter((text) => text !== "")
          .map((text) => collapse(text))
          .toSorted();
        if (JSON.stringify(docs) !== JSON.stringify(port.documentation.toSorted())) {
          this.problems.push(`Documentation of ${key} differs from the Robot suite`);
        }
      }
    }
    for (const key of ported.keys()) {
      this.problems.push(`Test not in the Robot suite: ${key}`);
    }
  }

  private async checkKeywordsAndVariables(manifest: Manifest): Promise<void> {
    const files = [...new Set([...manifest.keywords, ...manifest.variables].map((entry) => entry.file))];
    for (const file of files) {
      // oxlint-disable-next-line no-await-in-loop -- loads the modules one by one
      await import(join(E2E_ROOT, "TestSuites", file.replace(/\.robot$/, ".ts")));
    }
    const expected = new Set<string>();
    for (const keyword of manifest.keywords) {
      const qualified = `${keyword.module}.${keyword.name}`;
      expected.add(qualified);
      this.checked.keywords++;
      const entry = KEYWORD_REGISTRY.get(qualified);
      if (entry == null) {
        this.problems.push(`Keyword missing: ${qualified}`);
        continue;
      }
      const source = entry.implementation.toString();
      const varargs = keyword.arguments.findIndex((argument) => argument.kind === "@");
      const positional = varargs === -1 ? keyword.arguments : keyword.arguments.slice(0, varargs + 1);
      const namedOnly = varargs === -1 ? [] : keyword.arguments.slice(varargs + 1);
      const wanted = positional.map((argument) => argument.name);
      const actual = parameterNames(source);
      if (wanted.join(",") !== actual.join(",")) {
        this.problems.push(`Arguments of ${qualified}: (${actual.join(", ")}) should be (${wanted.join(", ")})`);
      }
      for (const argument of namedOnly) {
        if (!new RegExp(`namedOnly\\(`).test(source) || !source.includes(argument.name)) {
          this.problems.push(`Named-only argument ${argument.robot} of ${qualified} is missing`);
        }
      }
    }
    for (const qualified of KEYWORD_REGISTRY.keys()) {
      const [module] = qualified.split(".");
      if (manifest.keywords.some((keyword) => keyword.module === module) && !expected.has(qualified)) {
        this.problems.push(`Keyword not in the Robot suite: ${qualified}`);
      }
    }
    for (const variable of manifest.variables) {
      this.checked.variables++;
      if (!(variable.name in V)) {
        this.problems.push(`Variable missing: \${${variable.name}} (${variable.file})`);
        continue;
      }
      const literal = literalValue(variable.values);
      // A name defined in several files (texts_FI and texts_ENG) takes the first loaded value, like in Robot
      const definitions = manifest.variables.filter((other) => other.name === variable.name);
      const ambiguous = new Set(definitions.map((other) => JSON.stringify(other.values))).size > 1;
      if (ambiguous) {
        if (definitions[0] === variable) {
          this.notes.push(
            `\${${variable.name}} has different values in ${definitions.map((other) => other.file).join(", ")}`
          );
        }
        continue;
      }
      if (literal != null && V[variable.name] !== literal) {
        this.problems.push(
          `Value of \${${variable.name}} (${variable.file}): ${JSON.stringify(V[variable.name])} should be ${JSON.stringify(literal)}`
        );
      }
    }
  }

  // Playwright awaits onEnd but not onBegin, so the module imports happen here
  async onEnd(_result: FullResult): Promise<{ status: FullResult["status"] } | undefined> {
    await this.checkKeywordsAndVariables(this.manifest);
    const { tests, keywords, variables } = this.checked;
    if (this.notes.length > 0) {
      process.stdout.write(`Notes:\n${this.notes.map((note) => `  - ${note}`).join("\n")}\n`);
    }
    if (this.problems.length > 0) {
      process.stdout.write(
        `Naming parity: ${this.problems.length} problem(s)\n${this.problems.map((p) => `  - ${p}`).join("\n")}\n`
      );
      return { status: "failed" };
    }
    process.stdout.write(
      `Naming parity OK: ${tests} tests, ${keywords} keywords and ${variables} variables match the Robot suite.\n`
    );
    return undefined;
  }

  printsToStdio(): boolean {
    return true;
  }
}

// oxlint-disable-next-line import/no-default-export -- Playwright loads a reporter's default export
export default NamingParityReporter;
