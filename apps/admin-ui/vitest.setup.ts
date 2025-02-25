import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { vi, afterEach } from "vitest";
// TODO add vitest-axe

// react-dom tests can't automatically cleanup without vitest globals
afterEach(() => {
  cleanup();
});

vi.mock("react-i18next", () => ({
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
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
}));
