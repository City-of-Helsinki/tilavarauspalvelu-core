// eslint-disable require-await, @typescript-eslint/no-explicit-any
import { describe, expect, it, vi } from "vitest";

async function withMockedEnv(env: Record<string, any>, fn: (utils: any) => Promise<void>) {
  vi.resetModules();
  vi.doMock("../env.mjs", () => ({ env }));
  // Dynamic import is required here because vi.doMock only affects modules that are imported after the mock is set up.
  // This ensures each test gets a fresh version of baseUtils using the current mocked environment variables.
  const utils = await import("./baseUtils");
  await fn(utils);
}

describe("getStaffRelease", () => {
  it("returns correct app version string", async () => {
    // Default app name, branch name present
    await withMockedEnv(
      {
        NEXT_PUBLIC_SOURCE_BRANCH_NAME: "feature-branch",
        NEXT_PUBLIC_SOURCE_VERSION: "abcdef12",
      },
      async ({ getStaffRelease }) => {
        expect(getStaffRelease()).toBe("tilavarauspalvelu-staff-ui@feature-branch");
      }
    );

    // Default app name, only version present
    await withMockedEnv(
      {
        NEXT_PUBLIC_SOURCE_BRANCH_NAME: undefined,
        NEXT_PUBLIC_SOURCE_VERSION: "12345678deadbeef",
      },
      async ({ getStaffRelease }) => {
        expect(getStaffRelease()).toBe("tilavarauspalvelu-staff-ui@12345678");
      }
    );

    // Default app name, neither branch nor version present
    await withMockedEnv(
      {
        NEXT_PUBLIC_SOURCE_BRANCH_NAME: undefined,
        NEXT_PUBLIC_SOURCE_VERSION: undefined,
      },
      async ({ getStaffRelease }) => {
        expect(getStaffRelease()).toBe("tilavarauspalvelu-staff-ui@local");
      }
    );
  });

  it("uses Sentry project override if set", async () => {
    await withMockedEnv(
      {
        NEXT_PUBLIC_SENTRY_PROJECT: "custom-sentry-project",
        NEXT_PUBLIC_SOURCE_BRANCH_NAME: "main",
        NEXT_PUBLIC_SOURCE_VERSION: "abcdef12",
      },
      async ({ getStaffRelease }) => {
        expect(getStaffRelease()).toBe("custom-sentry-project@abcdef12");
      }
    );
  });

  it("replaces '/' with '-' in version string", async () => {
    await withMockedEnv(
      {
        NEXT_PUBLIC_SOURCE_BRANCH_NAME: "feature/with/slash",
        NEXT_PUBLIC_SOURCE_VERSION: "abcdef12",
      },
      async ({ getStaffRelease }) => {
        expect(getStaffRelease()).toBe("tilavarauspalvelu-staff-ui@feature-with-slash");
      }
    );
    await withMockedEnv(
      {
        NEXT_PUBLIC_SENTRY_PROJECT: "custom-sentry-project",
        NEXT_PUBLIC_SOURCE_BRANCH_NAME: "release/2026/05",
        NEXT_PUBLIC_SOURCE_VERSION: "abcdef12",
      },
      async ({ getStaffRelease }) => {
        expect(getStaffRelease()).toBe("custom-sentry-project@release-2026-05");
      }
    );
  });
});
