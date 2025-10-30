const formatters = (language: string): Record<string, Intl.NumberFormat> => ({
  default: new Intl.NumberFormat(),
  currency: new Intl.NumberFormat(language, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }),
  currencyWithDecimals: new Intl.NumberFormat(language, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  whole: new Intl.NumberFormat(language, {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }),
  oneDecimal: new Intl.NumberFormat(language, {
    style: "decimal",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }),
  twoDecimal: new Intl.NumberFormat(language, {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  strippedDecimal: new Intl.NumberFormat(language, {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }),
});

export default formatters;
