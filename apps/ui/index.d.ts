export {};

declare global {
  interface Window {
    _paq: string[][];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    msw: any;
  }
}
