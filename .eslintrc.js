module.exports = {
  extends: ['airbnb-typescript-prettier', 'plugin:jsx-a11y/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    createDefaultProgram: true,
    project: './tsconfig.eslint.json',
  },
  env: {
    browser: true,
    jest: true,
    node: true,
  },
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      { devDependencies: ['e2e/**/*.ts'] },
    ],
    'import/no-unresolved': 0,
    'react/prop-types': 0,
    'react/destructuring-assignment': 0,
    'react/static-property-placement': 0,
    'jsx-a11y/alt-text': 1,
    'react/require-default-props': 0,
    'react/jsx-props-no-spreading': 0,
    'jsx-a11y/label-has-associated-control': [
      'error',
      {
        labelComponents: [],
        labelAttributes: [],
        controlComponents: [],
        assert: 'htmlFor',
        depth: 25,
      },
    ],
    'import/prefer-default-export': 0,
  },
  plugins: ['jsx-a11y'],
};
