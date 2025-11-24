import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { vi, expect, afterEach, afterAll, beforeAll } from "vitest";
import type { Mock } from "vitest";

// TODO add vitest-axe

beforeAll(() => {
  // Workaround react-testing-library hard coding to jest.useFakeTimers
  vi.stubGlobal("jest", {
    advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
  });
});
afterAll(() => {
  vi.unstubAllGlobals();
});

// react-dom tests can't automatically cleanup without vitest globals
afterEach(() => {
  cleanup();
});

vi.mock("next-i18next", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useTranslation: () => {
      return {
        t: (str: string, args: unknown) => `${str}${args ? " " + JSON.stringify(args) : ""}`,
        // t: (str: string) => str,
        i18n: {
          changeLanguage: () => new Promise(() => {}),
          language: "fi",
          exists: (str: string) => {
            return !/failExistsOnPurpose/i.test(str);
          },
        },
      };
    },
  };
});

expect.extend({
  // specialised version to match next/navigation updates when
  // we only save values to search params without causing side effects on the UI (e.g. scroll)
  // expect the nth call to have url params
  searchParamCall(received: Mock, params: URLSearchParams, nth = 0) {
    if (received.mock.calls.length < nth + 1) {
      return {
        pass: false,
        message: () => `Expected at least ${nth + 1} calls, but received ${received.mock.calls.length}`,
      };
    }
    const [one, two, three] = received.mock.calls[nth] ?? [];
    const prefix = nth !== 0 ? `${nth}th ` : "";
    if (one == null) {
      return {
        pass: this.isNot && one == null && two == null && three == null,
        message: () => `${prefix}mock was not called with any parameters`,
      };
    }
    return {
      pass:
        three != null &&
        one?.query === params.toString() &&
        two === undefined &&
        three?.scroll === false &&
        three?.shallow === true,
      message: () => `Expected ${prefix}mock call ${params.toString()} to ${this.isNot ? " not" : ""}be ${one.query}`,
    };
  },
});
