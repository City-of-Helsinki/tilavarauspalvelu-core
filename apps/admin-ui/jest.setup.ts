/* eslint-disable import/no-extraneous-dependencies */
// @ts-check
import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);
// jest.setTimeout(10000);

// query-string is esm only
jest.mock("query-string" , () => ({
    __esModule: true,
    default: {
        parse :jest.fn(),
        stringify: jest.fn()
    }
}))

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
