const https = require("https");
const fs = require("fs");
const next = require("next");
const { parse } = require("url");

// TODO env variables don't seem to work for hostname and port
const publicPath = "/kasittely";
const hostname = "local-tilavaraus.hel.fi";
const SSL_CRT_FILE = "../common/certificates/local-tilavaraus.crt";
const SSL_KEY_FILE = "../common/certificates/local-tilavaraus.key";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

var options = {
  key: fs.readFileSync(SSL_KEY_FILE),
  cert: fs.readFileSync(SSL_CRT_FILE),
};

app.prepare().then(() => {
  https
    .createServer(options, (req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    })
    .listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on https://${hostname}:${port}${publicPath}`);
    });
});
