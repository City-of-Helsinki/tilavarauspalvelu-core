// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from "globals";
import reactPlugin from 'eslint-plugin-react';
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import graphqlPlugin from '@graphql-eslint/eslint-plugin'

const gqlConfig = {
  files: ['**/*.graphql'],
  languageOptions: {
    parser: graphqlPlugin.parser,
  },
  plugins: {
    '@graphql-eslint': graphqlPlugin
  },
  rules: {
    ...graphqlPlugin.configs['flat/operations-recommended'].rules,
    "@graphql-eslint/selection-set-depth": ["error", { maxDepth: 10 }],
    // can't use shared fragments in common if this rule is on
    // disabling rules inside gql doesn't work sometimes
    "@graphql-eslint/no-unused-fragments": "off",
  },
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
  processor: graphqlPlugin.processor,
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
  reactPlugin.configs.flat['jsx-runtime'],
  {
    plugins: {
      "react-hooks": eslintPluginReactHooks,
    },
    rules: { ...eslintPluginReactHooks.configs.recommended.rules },
  },
  eslintPluginPrettierRecommended,
  myConfig,
  gqlConfig,
  {
    ignores: [
      "node_modules/",
      ".next/",
      ".turbo/",
      "out/",
      "public/",
      "**/gql-types.ts",
    ]
  }
];
