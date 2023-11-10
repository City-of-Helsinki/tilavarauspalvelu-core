module.exports = {
  extends: ["airbnb-typescript-prettier", "plugin:jsx-a11y/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["jsx-a11y", "@typescript-eslint"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  root: true,
  env: {
    browser: true,
    jest: true,
    node: true,
  },
  ignorePatterns: ["node_modules", "dist", "email", "types/gql-types.ts"],
  overrides: [
    {
      files: [".eslintrc.js", ".eslintrc.cjs"],
      rules: {
        "@typescript-eslint/naming-convention": ["off"],
      },
    },
  ],
  rules: {
    "global-require": 0,
    // enforce null checks are == / != everything else ===
    eqeqeq: ["error", "always", { null: "never" }],
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
    "react/destructuring-assignment": 0,
    "react/jsx-props-no-spreading": 0,
    "react/prop-types": 0,
    "react/require-default-props": 0,
    "react/static-property-placement": 0,
    "@typescript-eslint/camelcase": ["off"], // There seems to be no other way to override this than disabling it and rewriting the rules in the naming-convention
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
        format: ["camelCase", "PascalCase", "UPPER_CASE"],
      },
      {
        selector: "property",
        format: ["camelCase", "snake_case", "PascalCase", "UPPER_CASE"],
      },
      {
        selector: "typeLike",
        format: ["PascalCase"],
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
        namedComponents: ["arrow-function"],
        unnamedComponents: "arrow-function",
      },
    ],
  },
};
