const path = require('path');
const fs = require('fs');
const express = require('express');
const serialize = require('serialize-javascript');
const config = require('./config');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static('build', { index: false }));

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
