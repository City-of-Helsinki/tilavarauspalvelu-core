import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import App from './App';
import reportWebVitals from './reportWebVitals';

if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: `tilavarauspalvelu-ui@${process.env.npm_package_version}`,
    integrations: [
      new Sentry.Integrations.GlobalHandlers({
        onunhandledrejection: true,
        onerror: true,
      }),
    ],
  });
}

const boot =
  process.env.NODE_ENV === 'development' ? ReactDOM.render : ReactDOM.hydrate;

boot(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
