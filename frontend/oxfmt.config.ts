import { defineConfig } from "oxfmt";

export default defineConfig({
  singleQuote: false,
  trailingComma: "es5",
  printWidth: 120,
  sortImports: {
    newlinesBetween: false,
    internalPattern: ["@/", "@test/", "@lib/"],
    customGroups: [
      {
        groupName: "react-libs",
        elementNamePattern: ["react", "react-**"],
      },
      {
        groupName: "next-libs",
        elementNamePattern: ["next", "next-**"],
      },
      {
        groupName: "node-libs",
        elementNamePattern: ["node:*"],
      },
      {
        groupName: "packages",
        elementNamePattern: ["ui/**", "@ui/**"],
      },
      {
        groupName: "gql-types",
        elementNamePattern: ["@gql/**"],
      },
    ],
    groups: [
      "react-libs",
      "node-libs",
      "next-libs",
      ["value-builtin", "value-external"],
      "type-import",
      "packages",
      "gql-types",
      "internal",
      ["parent", "sibling", "index"],
    ],
  },
});
