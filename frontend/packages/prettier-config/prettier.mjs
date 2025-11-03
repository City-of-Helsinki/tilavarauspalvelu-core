// NOTE invalid plugins will break all plugins (not just the invalid one)
// e.g. for "@prettier/plugin-oxc" to work we'd need to setup parsers properly
// otherwise all plugins are broken

/** @type {import('prettier').Options} */
export default {
  singleQuote: false,
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  trailingComma: "es5",
  printWidth: 120,
  importOrder: [
    "^react",
    "<BUILTIN_MODULES>",
    "<THIRD_PARTY_MODULES>",
    "^ui/(.*)$",
    "^@ui/(.*)$",
    "^@/(.*)$",
    "^@gql/(.*)$",
    "^[./]",
  ],
};
