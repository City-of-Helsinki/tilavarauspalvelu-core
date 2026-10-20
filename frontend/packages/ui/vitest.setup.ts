import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { vi, afterEach, expect } from "vitest";
// vitest-axe only exports the matchers as a namespace
// oxlint-disable-next-line import/no-namespace
import * as axeMatchers from "vitest-axe/matchers";

expect.extend(axeMatchers);

// react-dom tests can't automatically cleanup without vitest globals
afterEach(() => {
  cleanup();
});

vi.mock("next-i18next/pages", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
        language: "fi",
        exists: (str: string) => {
          if (/failExistsOnPurpose/i.test(str)) {
            return false;
          }
          return true;
        },
      },
    };
  },
  i18n: {},
}));
