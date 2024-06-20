// @ts-check
const { defineConfig } = require('eslint-define-config');
const { resolve } = require('node:path');

const project = resolve(process.cwd(), "tsconfig.json");

const SCHEMA_PATH = "../../tilavaraus.graphql";

/// <reference types="@eslint-types/typescript-eslint" />
module.exports = defineConfig({
  overrides: [
    {
      "files": ["*.ts", "*.tsx"],
      "processor": "@graphql-eslint/graphql",
    },
    {
      "files": ["*.graphql"],
      "parser": "@graphql-eslint/eslint-plugin",
      "plugins": ["@graphql-eslint"],
      // operations is the client side queries
      "extends": "plugin:@graphql-eslint/operations-recommended",
      parserOptions: {
        schema: SCHEMA_PATH,
        // monorepo paths... should use a find root function
        operations: ["../../apps/**/*.{ts,tsx}", "../../packages/**/*.{ts,tsx}"],
        // our graphql codegen config is old and has issues disable it and use the above
        skipGraphQLConfig: true
     },
      rules: {
        "@graphql-eslint/no-deprecated": "warn",
      },
    },
  ],
  root: true,
  extends: [
    require.resolve('@vercel/style-guide/eslint/node'),
    require.resolve('@vercel/style-guide/eslint/typescript'),
    require.resolve('@vercel/style-guide/eslint/browser'),
    require.resolve('@vercel/style-guide/eslint/react'),
    require.resolve('@vercel/style-guide/eslint/jest-react'),
    "plugin:prettier/recommended",
  ],
  plugins: [
    "prettier",
  ],
  parserOptions: {
    project,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [
    'gql-types.ts',
  ],
  env: {
    browser: true,
    jest: true,
    node: true,
  },
  globals: {
    React: true,
    JSX: true,
  },
  rules: {
    // TODO temp rules from migrating from airbnb to vercel style-guide
    "@typescript-eslint/prefer-nullish-coalescing": 0,
    "unicorn/filename-case": 0,
    "@typescript-eslint/no-unsafe-enum-comparison": 0,
    "@typescript-eslint/explicit-function-return-type": 0,
    "react/jsx-sort-props": 0,
    "react/jsx-no-leaked-render": 0,
    "@typescript-eslint/no-unnecessary-condition": 0,
    "@typescript-eslint/no-confusing-void-expression": 0,
    "eslint-comments/require-description": 0,
    "@typescript-eslint/no-misused-promises": 0,
    "@typescript-eslint/no-unsafe-member-access": 0,
    "@typescript-eslint/consistent-type-definitions": 0,
    "@typescript-eslint/consistent-type-imports": 0,
    "@typescript-eslint/require-await": 0,
    "@typescript-eslint/no-floating-promises": 0,
    "@typescript-eslint/prefer-optional-chain": 0,
    "@typescript-eslint/no-unsafe-assignment": 0,
    "@typescript-eslint/prefer-regexp-exec": 0,
    "@typescript-eslint/non-nullable-type-assertion-style": 0,
    "@typescript-eslint/array-type": 0,
    "@typescript-eslint/prefer-ts-expect-error": 0,
    "@typescript-eslint/no-unsafe-argument": 0,
    "@typescript-eslint/restrict-template-expressions": 0,
    "@typescript-eslint/consistent-indexed-object-style": 0,
    "@typescript-eslint/consistent-type-assertions": 0,
    "@typescript-eslint/no-unnecessary-type-assertion": 0,
    "@typescript-eslint/no-unsafe-call": 0,
    "@typescript-eslint/no-unsafe-return": 0,
    "@typescript-eslint/no-unnecessary-type-arguments": 0,
    // TODO there should be rules for this already
    "@typescript-eslint/naming-convention": 0,
    "no-implicit-coercion": 0,
    "import/no-named-as-default-member": 0,
    "import/no-named-as-default": 0,
    "import/no-default-export": 0,
    "import/order": 0,
    "tsdoc/syntax": 0,
    "jest/require-top-level-describe": 0,
    "jest/no-conditional-expect": 0,
    "jest/prefer-lowercase-title": 0,
    "jest/no-disabled-tests": 0,
    "jest/no-identical-title": 0,
    "jest/no-mocks-import": 0,
    "testing-library/prefer-screen-queries": 0,
    "testing-library/render-result-naming-convention": 0,
    "testing-library/prefer-find-by": 0,
    "testing-library/prefer-presence-queries": 0,
    "testing-library/await-async-events": 0,
    "testing-library/await-async-utils": 0,
    "testing-library/no-node-access": 0,
    "testing-library/no-wait-for-multiple-assertions": 0,
    "react/display-name": 0,
    "react/hook-use-state": 0,
    "react/jsx-pascal-case": 0,
    "camelcase": 0,
    "no-constant-binary-expression": 0,
    "prefer-named-capture-group": 0,
    // fails to find lodash...
    "import/named": 0,
    // afaik this conflicts with @typescript-eslint/no-unused-vars
    "no-unused-vars": 0,
    // enforce null checks are == / != everything else ===
    eqeqeq: ["error", "always", { null: "never" }],
    // mixing mjs with ts in nextjs causes issues
    "import/extensions": [
      "error",
      "never",
      {
        "mjs": "always",
        "cjs": "always",
        "json": "always",
      },
    ],
    // prefer explicit cases over defaults
    "default-case": 0,
    // FIXME this is missing
    // "@typescript-eslint/switch-exhaustiveness-check": "error",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: true,
      },
    ],
    // allow deconstruction and _ for unused vars
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "import/no-unresolved": "off",
    "import/prefer-default-export": 0,
    "jsx-a11y/alt-text": 1,
    "jsx-a11y/label-has-associated-control": [
      "error",
      {
        labelComponents: [],
        labelAttributes: [],
        controlComponents: [],
        assert: "htmlFor",
        depth: 25,
      },
    ],
    "no-nested-ternary": 0,
    "react/jsx-no-useless-fragment": [
      "error",
      {
        allowExpressions: true,
      },
    ],
    "react/destructuring-assignment": 0,
    "react/jsx-props-no-spreading": 0,
    "react/prop-types": 0,
    "react/require-default-props": 0,
    "react/static-property-placement": 0,
    "react/function-component-definition": [
      "error",
      {
        namedComponents: ["function-declaration", "arrow-function"],
        unnamedComponents: ["function-expression", "arrow-function"],
      },
    ],
    // There seems to be no other way to override this than disabling it and rewriting the rules in the naming-convention
    "@typescript-eslint/camelcase": ["off"],
    "@typescript-eslint/no-empty-function": 0,
    "react/no-unstable-nested-components": [
      "warn",
      {
        allowAsProps: true,
      },
    ],
  },
});
