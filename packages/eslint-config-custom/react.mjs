// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from "globals";
import reactPlugin from 'eslint-plugin-react';
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

// const project = resolve(process.cwd(), "tsconfig.json");

// const SCHEMA_PATH = "../../tilavaraus.graphql";

// import graphqlPlugin from '@graphql-eslint/eslint-plugin';
// import { processors as gqlProcessor } from '@graphql-eslint/eslint-plugin'
import graphqlPlugin from '@graphql-eslint/eslint-plugin'
// import { GraphQLConfig } from "graphql-config";
//

  /*
const gqlConfig = {
 overrides: [
    {
      "files": ["*.ts", "*.tsx"],
      "processor": "@graphql-eslint/graphql",
    },
    {
      files: ["*.graphql"],
      parser: processors.parser , // "@graphql-eslint/eslint-plugin",
      parserOptions: {
        graphQLConfig: {
          schema: SCHEMA_PATH,
          */
          // monorepo paths... should use a find root function
          // operations: ["../../apps/**/*.{ts,tsx}", "../../packages/**/*.{ts,tsx}"],
  /*
          // our graphql codegen config is old and has issues disable it and use the above
          skipGraphQLConfig: true
        }
      },
      "plugins": {
        "@graphql-eslint": graphqlPlugin,
      },
      // operations is the client side queries
      // "extends": "plugin:@graphql-eslint/operations-recommended",
      rules: {
        "@graphql-eslint/no-deprecated": "warn",
        "@graphql-eslint/selection-set-depth": ["error", { maxDepth: 10 }],
      },
    },
  ],
  ignorePatterns: [
    'gql-types.ts',
  ],
  },
}
  */
const gqlConfig = {
    files: ['**/*.graphql'],
    languageOptions: {
      parser: graphqlPlugin.parser
    },
    plugins: {
      '@graphql-eslint': graphqlPlugin
    },
    rules: {
      '@graphql-eslint/known-type-names': 'error'
      // ... other GraphQL-ESLint rules
    }
  };

/** @type {import('eslint').Linter.RulesRecord} */
const myRules = {
  "no-console": "error",
  // enforce null checks are == / != everything else ===
  eqeqeq: ["error", "always", { null: "never" }],
  // afaik this conflicts with @typescript-eslint/no-unused-vars
  "no-unused-vars": 0,
  // allow deconstruction and _ for unused vars
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      args: "all",
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_|^React$",
      caughtErrors: "all",
      caughtErrorsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
      ignoreRestSiblings: true,
    },
  ],
  // for some reason this raises errors for "key" props in jsx arrays
  "react/prop-types": "off"
  // mixing mjs with ts in nextjs causes issues
  /*
  "import/extensions": [
    "error",
    "never",
    {
      "mjs": "always",
      "cjs": "always",
      "json": "always",
    },
  ],
  */
};

const myConfig = {
  ...reactPlugin.configs.flat.recommended,
  settings: {
    react: {
      version: "detect",
    },
  },
  languageOptions: {
    ...reactPlugin.configs.flat.recommended.languageOptions,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      ...globals.browser,
      ...globals.node,
    },
  },
  plugins: {
    react: reactPlugin,
  },
  rules: myRules,
};

const tsConfig = tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
);

export default [
  ...tsConfig,
  gqlConfig,
  reactPlugin.configs.flat['jsx-runtime'],
  {
    plugins: {
      "react-hooks": eslintPluginReactHooks,
    },
    rules: { ...eslintPluginReactHooks.configs.recommended.rules },
  },
  eslintPluginPrettierRecommended,
  myConfig,
  {
    ignores: [
      "node_modules/",
      ".next/",
      ".turbo/",
      "out/",
      "public/",
    ]
  }
];
/*
export default [
  myConfig,
];
*/

/// <reference types="@eslint-types/typescript-eslint" />
/*
export default [{
   root: true,
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended",
  ],
  plugins: [
    "prettier",
  ],

  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
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
    // Custom rule to enforce data-testid attribute naming
    'react/no-unknown-property': ['error', {
      requireDataLowercase: true,
    }],
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
}];
*/
