module.exports ={
  extends: ["stylelint-config-standard"],
  customSyntax: "postcss-styled-syntax",
  ignore: [
    "hooks",
  ],
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
    "comment-empty-line-before": null,
    "custom-property-empty-line-before": null,
    // end temp rules after upgrade
  },
}
