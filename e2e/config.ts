export default {
  BASE_URL: process.env.TESTCAFE_URL_PREFIX || 'http://localhost:3000/',
};

export const random = {
  // todo use seedable generator
  randomInt: (max) => Math.floor(Math.random() * Math.floor(max)),
};
