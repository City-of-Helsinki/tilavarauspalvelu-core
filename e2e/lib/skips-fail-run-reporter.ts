/**
 * Fails the run when a test was skipped at runtime, like the Robot runners did: a skip means a test it needs
 * failed (e.g. "Check emails from reservations" skips when "User can make paid single booking" fails).
 */
import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";

class SkipsFailRunReporter implements Reporter {
  private readonly skipped = new Map<string, TestCase>();

  onTestEnd(test: TestCase, result: TestResult): void {
    // A test filtered out with --grep never ends, so only runtime skips (test.skip(), Skip) count
    if (result.status === "skipped") {
      this.skipped.set(test.id, test);
    } else {
      this.skipped.delete(test.id);
    }
  }

  async onEnd(result: FullResult): Promise<{ status: FullResult["status"] } | undefined> {
    await Promise.resolve();
    if (this.skipped.size === 0 || result.status !== "passed") {
      return undefined;
    }
    const names = [...this.skipped.values()].map((test) => `  - ${test.titlePath().slice(1).join(" › ")}`);
    process.stdout.write(`\n${this.skipped.size} test(s) were skipped, which fails the run:\n${names.join("\n")}\n`);
    return { status: "failed" };
  }

  printsToStdio(): boolean {
    return false;
  }
}

// oxlint-disable-next-line import/no-default-export -- Playwright loads a reporter's default export
export default SkipsFailRunReporter;
