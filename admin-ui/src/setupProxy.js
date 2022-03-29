const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "https://tilavaraus.hel.fi",
      pathRewrite: {
        "^/api/": "/",
      },
      changeOrigin: true,
      /*      onProxyReq: (preq, req, res) => {
              preq.removeHeader("Authorization");
            }*/
    })
  );
};
