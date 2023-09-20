const https = require("https");
const fs = require("fs");
const next = require("next");
const { parse } = require("url");

// TODO env variables don't seem to work for hostname and port
const publicPath = "/kasittely";
const hostname = "local-tilavaraus.hel.fi";
const SSL_CRT_FILE = "../../certificates/local-tilavaraus.crt";
const SSL_KEY_FILE = "../../certificates/local-tilavaraus.key";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

var options = {
  key: fs.readFileSync(SSL_KEY_FILE),
  cert: fs.readFileSync(SSL_CRT_FILE),
};

// TODO add rewrite for /graphql/ and /api/ to the backend url (localhost:8000)
// this is because otherwise we lose the session cookie
// in production we don't need this
// and this server can be deprecated after we change dev to use http (instead of ssl)

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
