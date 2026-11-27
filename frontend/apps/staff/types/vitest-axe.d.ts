import type { AxeMatchers } from "vitest-axe/matchers";

declare module "vitest" {
  // oxlint-disable-next-line typescript/no-explicit-any, typescript/no-empty-object-type
  interface Assertion<T = any> extends AxeMatchers {}
  // oxlint-disable-next-line typescript/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
