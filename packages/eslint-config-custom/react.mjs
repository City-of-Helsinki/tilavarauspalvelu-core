// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- types missing?
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import graphqlPlugin from "@graphql-eslint/eslint-plugin";
import eslintPluginImportX from "eslint-plugin-import-x";

const SCHEMA_FILE = "../../tilavaraus.graphql";

/** Construct a graphql config and only include that project's gql files
 *  @param path {string}
 *  @param disableUnusedFragments {boolean}
 * */
export function constructGQLConfig(path, disableUnusedFragments = false) {
  return {
    files: ["**/*.graphql"],
    languageOptions: {
      parser: graphqlPlugin.parser,
      parserOptions: {
        graphQLConfig: {
          schema: SCHEMA_FILE,
          documents: [`${path}/**/!(*.d|gql-types).{ts,tsx}`],
        },
      },
    },
    plugins: {
      "@graphql-eslint": graphqlPlugin,
    },
    rules: {
      ...graphqlPlugin.configs["flat/operations-recommended"].rules,
      "@graphql-eslint/selection-set-depth": ["error", { maxDepth: 10 }],
      // can't use shared fragments in common if this rule is on
      // disabling rules inside gql doesn't work sometimes
      "@graphql-eslint/no-unused-fragments": disableUnusedFragments
        ? "off"
        : "error",
    },
  };
}

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
  "@typescript-eslint/no-non-null-assertion": "error",
  // this only catches await errors if there is a single await that is missing
  // more complex rules:
  // - no-misused-promises
  // - no-floating-promises
  // both in typescript-eslint/recommended-type-checked
  // but out type generation is broken (so only recommended works)
  "require-await": "error",
  // for some reason this raises errors for "key" props in jsx arrays
  "react/prop-types": "off",
  "react/no-array-index-key": "error",
  "react/no-danger": "error",
  "react/no-invalid-html-attribute": "error",
  "react/jsx-wrap-multilines": "error",
  "react/jsx-no-useless-fragment": "error",
  "react/jsx-no-script-url": "error",
  "react/jsx-boolean-value": "error",
  "react/forward-ref-uses-ref": "error",
  "react/button-has-type": "error",
  "react/no-this-in-sfc": "error",
  "react/prefer-stateless-function": "error",
  "react/void-dom-elements-no-children": "error",
  // TODO enable in a separate commit
  // "react/no-unstable-nested-components": "error",
  // styled-components doesn't work with this (alternative would be disable this only for styled-components)
  "import-x/no-named-as-default": "off",
  // breaks admin-ui typescript paths
  "import-x/no-unresolved": "off",
  "import-x/no-dynamic-require": "warn",
  // mixing mjs with ts in nextjs causes issues
  "import-x/extensions": [
    "error",
    "never",
    {
      mjs: "always",
      cjs: "always",
      json: "always",
    },
  ],
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
    ...reactPlugin.configs.flat.recommended?.languageOptions,
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

const ignores = [
  "node_modules/",
  ".next/",
  ".turbo/",
  "out/",
  "public/",
  "**/gql-types.ts",
];

export default [
  ...tsConfig,
  reactPlugin.configs.flat["jsx-runtime"],
  {
    plugins: {
      "react-hooks": eslintPluginReactHooks,
    },
    rules: { ...eslintPluginReactHooks.configs.recommended.rules },
  },
  eslintPluginPrettierRecommended,
  eslintPluginImportX.flatConfigs.recommended,
  eslintPluginImportX.flatConfigs.typescript,
  myConfig,
  {
    ignores,
  },
];
