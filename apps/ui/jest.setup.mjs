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
