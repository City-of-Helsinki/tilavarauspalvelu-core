export {};

declare global {
  interface Window {
    _paq: string[][];
    msw: any;
  }
}
