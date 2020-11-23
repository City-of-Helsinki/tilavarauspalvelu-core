module.exports = {
  extends: [
    'airbnb-typescript-prettier'
  ],
  env: {
    jest: true
  },
  rules: {
    'react/prop-types': 0,
    'react/destructuring-assignment': 0,
    'react/static-property-placement': 0,
    'jsx-a11y/alt-text': 0,
    'react/jsx-props-no-spreading': 0,
  },
};
