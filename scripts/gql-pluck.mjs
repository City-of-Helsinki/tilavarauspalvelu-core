/**
 * GQL Pluck
 * Traverses all typescript files in the project in search of gql queries.
 * Outputs them to a single file per application.
 * All common fragments are included in both files.
 *
 * Assumption: this is always run using a package manager e.g. `pnpm gql-pluck`
 * otherwise all file paths are relative to the current working directory
 *
 * Usage: `pnpm gql-pluck`
 *
 * Output: `graphql/admin-queries.graphql` and `graphql/customer-queries.graphql`
 */
import { gqlPluckFromCodeStringSync } from "@graphql-tools/graphql-tag-pluck";
import { appendFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { glob } from "glob";

const OUTPUT_DIR = './gql-pluck-output';
const ADMIN_OUTPUT_FILE = 'admin-queries.graphql';
const CUSTOMER_OUTPUT_FILE = 'customer-queries.graphql';

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

// Should we include .js{x} also?
// No, since the project doesn't use those and they are not included in our query generation either.
//
// TODO these patterns are same as graphql.config.ts (but requires us setting up a common config file)
const admin_patterns = [
  "apps/admin-ui/**/!(*.d|gql-types).{ts,tsx}",
  "packages/common/**/!(*.d|gql-types).{ts,tsx}",
];
const customer_patterns = [
  "apps/ui/**/!(*.d|gql-types).{ts,tsx}",
  "packages/common/src/**/*.{ts,tsx}"
];

mkdirSync(OUTPUT_DIR, { recursive: true });

cleanOutput(path.join(OUTPUT_DIR, ADMIN_OUTPUT_FILE));
cleanOutput(path.join(OUTPUT_DIR, CUSTOMER_OUTPUT_FILE));

pluck(admin_patterns, path.join(OUTPUT_DIR, ADMIN_OUTPUT_FILE));
pluck(customer_patterns, path.join(OUTPUT_DIR, CUSTOMER_OUTPUT_FILE));
