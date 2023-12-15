const vercelPrettierOptions = require('@vercel/style-guide/prettier');

/** @type {import('prettier').Options} */
module.exports = {
  ...vercelPrettierOptions,
  singleQuote: false,
  trailingComma: 'es5',
};
