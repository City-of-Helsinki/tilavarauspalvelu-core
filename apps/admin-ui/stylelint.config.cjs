module.exports = {
  extends: ["stylelint-config-standard"],
  customSyntax: "postcss-styled-syntax",
  rules: {
    "media-feature-range-notation": "prefix",
    // temp rules after upgrade
    "no-empty-source": null,
    "media-query-no-invalid": null,
    "selector-pseudo-element-colon-notation": null,
    "alpha-value-notation": "number",
    "declaration-empty-line-before": null,
    "rule-empty-line-before": null,
    "at-rule-empty-line-before": null,
    "color-function-notation": null,
    "selector-class-pattern": null,
    // end temp rules after upgrade
    /*
    "csstools/value-no-unknown-custom-properties": [
      true,
      {
        importFrom: [
          path.resolve(__dirname, "./node_modules/hds-core/lib/base.css"),
          path.resolve(__dirname, "./src/variables.css"),
        ],
      },
    ],
    "no-descending-specificity": null,
  */
  },
};
