/* eslint-disable import/no-extraneous-dependencies */
// @ts-check
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/extend-expect";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);
// jest.setTimeout(10000);

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
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
