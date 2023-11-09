/* eslint-disable @typescript-eslint/naming-convention */
module.exports = {
  extends: [
    "airbnb-typescript-prettier",
    "plugin:jsx-a11y/recommended",
    "plugin:@next/next/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  env: {
    browser: true,
    jest: true,
    node: true,
  },
  rules: {
    "global-require": 0,
    // enforce null checks are == / != everything else ===
    eqeqeq: ["error", "always", { null: "never" }],
    "import/no-unresolved": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
      },
    ],
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
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: true,
      },
    ],
    "import/prefer-default-export": 0,
    "jsx-a11y/alt-text": 1,
    "jsx-a11y/anchor-is-valid": 0,
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
    "no-plusplus": 0,
    "no-script-url": 0,
    "react/destructuring-assignment": 0,
    "react/jsx-props-no-spreading": 0,
    "react/prop-types": 0,
    "react/require-default-props": 0,
    "react/static-property-placement": 0,
    // Prefer naming-conventation
    "camelcase": 0,
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "default",
        format: ["camelCase"],
      },
      {
        selector: "function",
        format: ["camelCase", "PascalCase"],
      },
      {
        selector: "variable",
        format: ["camelCase"],
      },
      {
        selector: "variable",
        // have to allow PascalCase because of defining React components with arrow functions
        format: ["camelCase", "PascalCase", "UPPER_CASE"],
        modifiers: ["const"],
      },
      {
        selector: "parameter",
        format: ["camelCase", "snake_case"],
        modifiers: ["unused"],
        leadingUnderscore: "require",
      },
      {
        selector: "property",
        format: ["camelCase", "snake_case", "PascalCase", "UPPER_CASE"],
      },
      {
        selector: "typeLike",
        format: ["StrictPascalCase"],
      },
      {
        selector: "enumMember",
        format: ["camelCase", "snake_case", "UPPER_CASE"],
      },
    ],
    "@typescript-eslint/no-empty-function": 0,
    "@typescript-eslint/no-var-requires": 0,
    "react/function-component-definition": [
      "error",
      {
        namedComponents: ["function-declaration", "arrow-function"],
        unnamedComponents: ["function-expression", "arrow-function"],
      },
    ],
  },
  plugins: ["jsx-a11y", "@typescript-eslint"],
};
