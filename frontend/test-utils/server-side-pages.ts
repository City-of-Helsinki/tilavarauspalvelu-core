import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Pages that can not use getServerSideProps.
// Next.js requires 404 and 500 to be static. _app, _document and _error are not pages.
const EXEMPT_PAGES = new Set(["_app.tsx", "_document.tsx", "_error.tsx", "404.tsx", "500.tsx"]);

const SERVER_SIDE_PROPS_EXPORT = /export\s+(async\s+function|function|const)\s+getServerSideProps\b/;

/// Returns the pages under pagesDir that do not export getServerSideProps.
/// The env is loaded on the server only, and all environments use the same client bundle.
/// Without getServerSideProps, Next.js runs App.getInitialProps in the browser on client navigation.
export function findPagesWithoutServerSideProps(pagesDir: string): string[] {
  return readdirSync(pagesDir, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.tsx?$/.test(file))
    .filter((file) => !EXEMPT_PAGES.has(file) && !file.startsWith(`api${path.sep}`))
    .filter((file) => !SERVER_SIDE_PROPS_EXPORT.test(readFileSync(path.join(pagesDir, file), "utf8")))
    .sort();
}
