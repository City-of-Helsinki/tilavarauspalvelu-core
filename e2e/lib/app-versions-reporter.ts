/**
 * Adds the versions of the apps in the test environment to the report: the HTML report shows them as its title, and
 * tools/report_summary.py reads them from the report's metadata for the job summary. They are read when the first test
 * that uses the test environment starts, and again at the end of the run, which also prints them. So nothing is read
 * when only the unit tests run or the tests are only listed.
 */
import type { FullConfig, Reporter, TestCase } from "@playwright/test/reporter";

/** The key of the versions in the report's metadata, which tools/report_summary.py reads */
export const APP_VERSIONS = "App versions";

const APPS = ["customer", "staff", "backend"] as const;

export type AppVersions = Record<(typeof APPS)[number], string>;

/** The version that an app answers with at a path, or "unknown" when it doesn't answer with one */
async function readVersion(baseURL: string, path: string): Promise<string> {
  try {
    // The backend answers with its version also when it isn't ready (503)
    const response = await fetch(new URL(path, baseURL), { signal: AbortSignal.timeout(10_000) });
    const { version } = (await response.json()) as { version?: unknown };
    return typeof version === "string" && version !== "" ? version : "unknown";
  } catch {
    return "unknown";
  }
}

/** The versions of the apps at a base URL, from the same paths that scripts/release-check.sh reads */
export async function readAppVersions(baseURL: string): Promise<AppVersions> {
  const [customer, staff, backend] = await Promise.all([
    readVersion(baseURL, "/healthcheck"),
    readVersion(baseURL, "/kasittely/healthcheck"),
    readVersion(baseURL, "/monitoring/readiness/"),
  ]);
  return { customer, staff, backend };
}

/** The versions on one line. An app whose version changed during the run gets its version at the end too. */
export function describeAppVersions(start: AppVersions, end: AppVersions): string {
  return APPS.map((app) =>
    start[app] === end[app] ? `${app} ${start[app]}` : `${app} ${start[app]} (${end[app]} at the end of the run)`
  ).join(", ");
}

class AppVersionsReporter implements Reporter {
  private config?: FullConfig;
  private baseURL = "";
  private atStart?: Promise<AppVersions>;

  onBegin(config: FullConfig): void {
    this.config = config;
  }

  onTestBegin(test: TestCase): void {
    const project = test.parent.project();
    // The unit tests run without the test environment
    if (this.atStart != null || project == null || project.name === "unit" || project.use.baseURL == null) {
      return;
    }
    this.baseURL = project.use.baseURL;
    this.atStart = readAppVersions(this.baseURL);
  }

  // The html reporter reads the metadata and its title in its own onEnd, which runs after this one because this
  // reporter is before it in playwright.config.ts
  async onEnd(): Promise<void> {
    if (this.config == null || this.atStart == null) {
      return;
    }
    const versions = describeAppVersions(await this.atStart, await readAppVersions(this.baseURL));
    this.config.metadata[APP_VERSIONS] = versions;
    // The HTML report shows its title at the top, but lists metadata other than the git and CI info only when its URL
    // ends with #?show-metadata-other. A title set in the environment wins.
    process.env.PLAYWRIGHT_HTML_TITLE ??= `${APP_VERSIONS}: ${versions}`;
    process.stdout.write(`\n${APP_VERSIONS}: ${versions}\n`);
  }

  printsToStdio(): boolean {
    return false;
  }
}

// oxlint-disable-next-line import/no-default-export -- Playwright loads a reporter's default export
export default AppVersionsReporter;
