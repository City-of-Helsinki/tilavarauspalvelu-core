import { gqlPluckFromCodeStringSync } from "@graphql-tools/graphql-tag-pluck";
import { appendFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { glob } from "glob";

const OUTPUT_DIR = './graphql';
const ADMIN_OUTPUT_FILE = 'admin-queries.graphql';
const CUSTOMER_OUTPUT_FILE = 'customer-queries.graphql';

// TODO setup the output correctly based on project root (not running directory)
// TODO do all three applications
// (single output file or no), no because
// - we might have same name queries in both of the applications
// - we need to include the common queries in both of the applications
// so ending up with two output files
//
// TODO should defragment the queries (but not must do in this tool, backend can do it before running the queries)

/** @param {string} outputFilePath */
function cleanOutput(outputFilePath) {
  try {
    rmSync(outputFilePath, { force: true });
  } catch (e) {
    // ignore
  }
}

/** @param {string[]} patterns
 *  @param {string} outputFile
 * */
function pluck(patterns, outputFile) {
  // TODO should we include .js{x} also?
  // TODO apps/ui/**/*.{ts,tsx} doesn't work
  /** @type {string[]} */
  const files = glob.sync(patterns);

  files.forEach(file => {
    const content = readFileSync(file, 'utf-8');

    const queries = gqlPluckFromCodeStringSync(file, content);

    if (queries.length > 0) {
      queries.forEach((query) => {
        appendFileSync(outputFile,
          query.body + '\n\n'
        );
      });
    }
  });
}

// TODO should improve the file pattern
// so that we pick all packages (but only source files)
// some other files fail to parse
const admin_patterns = [
  "apps/admin-ui/src/**/*.{ts,tsx}",
  "packages/common/src/**/*.{ts,tsx}"
];
const customer_patterns = [
  "apps/ui/**/!(*.d|gql-types).{ts,tsx}",
  "packages/common/src/**/*.{ts,tsx}"
];

mkdirSync(OUTPUT_DIR, { recursive: true });

cleanOutput(path.join(OUTPUT_DIR, ADMIN_OUTPUT_FILE));
cleanOutput(path.join(OUTPUT_DIR, CUSTOMER_OUTPUT_FILE));

pluck(
  admin_patterns,
  path.join(OUTPUT_DIR, ADMIN_OUTPUT_FILE),
);
pluck(
  customer_patterns,
  path.join(OUTPUT_DIR, CUSTOMER_OUTPUT_FILE),
);
