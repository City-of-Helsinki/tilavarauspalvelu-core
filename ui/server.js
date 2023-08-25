const { createServer } = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");

const dev = process.env.NODE_ENV !== "production";
const hostname = "local-tilavaraus.hel.fi";
const port = process.env.PORT ?? 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync("../common/certificates/local-tilavaraus.key"),
  cert: fs.readFileSync("../common/certificates/local-tilavaraus.crt"),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on https://local-tilavaraus.hel.fi:${port}`);
  });
});
