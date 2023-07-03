const https = require("https");
const fs = require("fs");
const next = require("next");
const { parse } = require("url");

const HOSTNAME = "local-tilavaraus.hel.fi";
const SSL_CRT_FILE = "../common/certificates/local-tilavaraus.crt";
const SSL_KEY_FILE = "../common/certificates/local-tilavaraus.key";

// const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const PORT = 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname: HOSTNAME, port: PORT, dir: __dirname });
const handle = app.getRequestHandler();

var options = {
  key: fs.readFileSync(SSL_KEY_FILE),
  cert: fs.readFileSync(SSL_CRT_FILE),
  // ca: [fs.readFileSync("root.crt")],
};

app.prepare().then(() => {
  https
    .createServer(options, (req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    })
    .listen(PORT, (err) => {
      if (err) throw err;
      console.log(`> Ready on https://${HOSTNAME}:${PORT}`);
    });
});
