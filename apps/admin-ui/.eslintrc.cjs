module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
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
  plugins: ["@typescript-eslint", "jsx-a11y"],
  root: true,
  env: {
    browser: true,
    jest: true,
    node: true,
  },
  rules: {
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
    "@typescript-eslint/switch-exhaustiveness-check": "error",
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
};
