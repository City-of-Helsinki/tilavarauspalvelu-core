// @ts-check
import "@testing-library/jest-dom";
// import { toHaveNoViolations } from "jest-axe";
// expect.extend(toHaveNoViolations);

// query-string is esm only
jest.mock("query-string", () => ({
  __esModule: true,
  default: {
    parse: jest.fn(),
    stringify: jest.fn(),
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
