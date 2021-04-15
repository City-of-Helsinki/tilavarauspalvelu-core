const path = require('path');
const fs = require('fs');
const express = require('express');
const serialize = require('serialize-javascript');
const expressStaticGzip = require('express-static-gzip');
const config = require('./config');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(
  expressStaticGzip('build', {
    enableBrotli: true,
    orderPreference: ['br', 'gz'],
    index: false,
  })
);

const index = fs
  .readFileSync(path.resolve('./build/index.html'), 'utf8')
  .toString();

app.get('/*', async (req, res) => {
  return res.send(
    index.replace(
      '</head>',
      `<script>
            window.__CONFIG__=  ${serialize(config)};
          </script>
        </head>`
    )
  );
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
