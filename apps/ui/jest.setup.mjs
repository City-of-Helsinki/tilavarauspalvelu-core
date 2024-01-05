// @ts-check
import "@testing-library/jest-dom";
// TODO extended-expect is not found in the ui (but it is in the admin-ui)
// import "@testing-library/jest-dom/extend-expect";
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
