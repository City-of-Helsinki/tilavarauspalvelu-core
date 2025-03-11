import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { vi, afterEach, afterAll, beforeAll } from "vitest";
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

vi.mock("next-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
        language: "fi",
        exists: (str: string) => {
          if (str.match(/failExistsOnPurpose/i)) {
            return false;
          }
          return true;
        },
      },
    };
  },
  i18n: {},
}));
