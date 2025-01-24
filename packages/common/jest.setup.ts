// @ts-check
import "@testing-library/jest-dom";
// import { toHaveNoViolations } from "jest-axe";
// expect.extend(toHaveNoViolations);

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

// eslint-disable-next-line no-console
const originalError = console.error.bind(console.error);
// Ignore act deprecation warnings
// (testing-library bumped it way too early since there is no act in React 18.2, only 18.3+)
const ACT_DEPRECATED_WARNING =
  "`ReactDOMTestUtils.act` is deprecated in favor of";
// Ignore defaultProps warning, next major react version will remove them
// Don't need to know about this in every test
const DEFAULT_PROPS_WARNING =
  "Support for defaultProps will be removed from function components";

beforeAll(() => {
  // eslint-disable-next-line no-console
  console.error = (msg: string) =>
    !(
      msg.toString().includes(ACT_DEPRECATED_WARNING) ||
      msg.toString().includes(DEFAULT_PROPS_WARNING)
    ) && originalError(msg);
});
afterAll(() => {
  // eslint-disable-next-line no-console
  console.error = originalError;
});
