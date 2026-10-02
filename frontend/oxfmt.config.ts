import { defineConfig } from "oxfmt";

export default defineConfig({
  singleQuote: false,
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
});
