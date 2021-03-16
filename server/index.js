import path from 'path';
import fs from 'fs';
import React from 'react';
import express from 'express';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter, matchPath } from 'react-router-dom';
import serialize from 'serialize-javascript';
import { ServerStyleSheet } from 'styled-components';
import App from '../src/App';
import Routes from '../src/common/routes';
import config from './config';

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static('build', { index: false }));

app.get('/*', async (req, res) => {
  const sheet = new ServerStyleSheet();

  let context = null;
  let indexedData = null;
  let html = null;

  try {
    let routeData = null;
    const currentRoute =
      Routes.find((route) => matchPath(req.url, route)) || {};
    const routeDetails = matchPath(req.url, currentRoute);
    const promise = currentRoute.loadData
      ? currentRoute.loadData(routeDetails.params)
      : Promise.resolve(null);
    try {
      routeData = await promise;
    } catch (err) {
      console.error(`error occured while fetching data for route ${currentRoute}`, err);
      routeData = undefined;
    }
    indexedData = currentRoute.dataKey
      ? { [currentRoute.dataKey]: routeData }
      : { routeData };
    context = { indexedData };
    html = ReactDOMServer.renderToString(
      sheet.collectStyles(
        <StaticRouter location={req.url} context={context}>
          <App />
        </StaticRouter>
      )
    );
  } catch (error) {
    console.log('error occurred while rendering', error);
  }

  const styles = sheet.getStyleTags();
  const indexFile = path.resolve('./build/index.html');
  fs.readFile(indexFile, 'utf8', (err, indexMarkup) => {
    if (err) {
      console.error('Something went wrong:', err);
      return res.status(500).send('Server error');
    }

    if (context) {
      if (context.status === 404) {
        res.status(404);
      }

      if (context.url) {
        return res.redirect(301, context.url);
      }
    }

    return res.send(
      indexMarkup
        .replace('<div id="root"></div>', `<div id="root">${html || ''}</div>`)
        .replace(
          '</head>',
          `${styles}
          <script>
            window.__CONFIG__=  ${serialize(config)};
          </script>
        </head>`
        )
        .replace(
          '</body>',
          `<script>window.__ROUTE_DATA__ = ${serialize(
            indexedData
          )}</script></body>`
        )
    );
  });
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
