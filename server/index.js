import path from 'path';
import fs from 'fs';
import React from 'react';
import express from 'express';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter, matchPath } from 'react-router-dom';
import serialize from 'serialize-javascript';
import App from '../src/App';
import Routes from '../src/common/routes';
import setupProxy from '../src/setupProxy';
import { ServerStyleSheet } from 'styled-components';

const PORT = process.env.PORT || 3000;
console.log('port', PORT, process.env.PORT);
const app = express();

app.use(express.static('build', { index: false }));
setupProxy(app);

app.get('/*', (req, res, next) => {
  const sheet = new ServerStyleSheet();

  const currentRoute = Routes.find((route) => matchPath(req.url, route)) || {};
  const routeDetails = matchPath(req.url, currentRoute);
  const promise = currentRoute.loadData
    ? currentRoute.loadData(routeDetails.params)
    : Promise.resolve(null);

  promise.then((data) => {
    const indexedData = currentRoute.dataKey
      ? { [currentRoute.dataKey]: data }
      : { data };
    const context = { indexedData };

    const html = ReactDOMServer.renderToString(
      sheet.collectStyles(
        <StaticRouter location={req.url} context={context}>
          <App />
        </StaticRouter>
      )
    );
    const styles = sheet.getStyleTags();
    const indexFile = path.resolve('./build/index.html');
    fs.readFile(indexFile, 'utf8', (err, indexMarkup) => {
      if (err) {
        console.error('Something went wrong:', err);
        return res.status(500).send('Server error');
      }

      if (context.status === 404) {
        res.status(404);
      }

      if (context.url) {
        return res.redirect(301, context.url);
      }

      return res.send(
        indexMarkup
          .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
          .replace('</head>', `${styles}</head>`)
          .replace(
            '</body>',
            `<script>window.__ROUTE_DATA__ = ${serialize(
              indexedData
            )}</script></body>`
          )
      );
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
