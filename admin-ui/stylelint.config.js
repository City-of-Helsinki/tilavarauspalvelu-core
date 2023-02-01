const path = require("path");

const config = {
  processors: ["stylelint-processor-styled-components"],
  extends: [
    "stylelint-config-recommended",
    "stylelint-config-styled-components",
  ],
  customSyntax: "postcss-scss",
  plugins: ["stylelint-value-no-unknown-custom-properties"],
  rules: {
    "csstools/value-no-unknown-custom-properties": [
      true,
      {
        importFrom: [
          path.resolve(__dirname, "../node_modules/hds-core/lib/base.css"),
          path.resolve(__dirname, "./src/variables.css"),
        ],
      },
    ],
    "no-descending-specificity": null,
  },
};

module.exports = config;
