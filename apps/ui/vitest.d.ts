import "vitest";

/* eslint-disable @typescript-eslint/no-empty-object-type */
interface CustomMatchers<R = unknown> {
  searchParamCall: (params: URLSearchParams, nth?: number) => R;
}

declare module "vitest" {
  interface Assertion<T = Mock<Procedure>> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */
