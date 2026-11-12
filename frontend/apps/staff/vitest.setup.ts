import "@testing-library/jest-dom/vitest";
import { MockLink } from "@apollo/client/testing";
import { cleanup } from "@testing-library/react";
import { afterAll, beforeAll, vi, afterEach } from "vitest";

// Apollo Client 4 delays mocked responses by 20-50 ms by default, the tests expect no delay (like Apollo Client 3)
MockLink.defaultOptions = { delay: 0 };

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
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
}));
