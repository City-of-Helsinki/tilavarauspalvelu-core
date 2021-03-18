import React from 'react';
import { Route, Switch } from 'react-router-dom';
import PageWrapper from './component/PageWrapper';
import './i18n';
import './index.scss';
import './variables.css';
import Routes from './common/routes';
import Applications from './applications/Applications';
import Application from './application/Application';
import { isBrowser } from './common/const';
import CreateApplication from './application/CreateApplication';

const OidcSecure = isBrowser
  ? // eslint-disable-next-line
    require('@axa-fr/react-oidc-context').OidcSecure
  : null;

function App(): JSX.Element {
  return (
    <PageWrapper>
      <Switch>
        {Routes.map((route) => (
          <Route
            key={route.path}
            exact={route.exact}
            path={route.path}
            render={() => {
              return <route.component />;
            }}
          />
        ))}
        {
          // client only routes
          isBrowser ? (
            <OidcSecure>
              <Route path="/create/:applicationRoundId">
                <CreateApplication />
              </Route>
              <Route path="/application/:applicationId">
                <Application />
              </Route>
              <Route path="/applications/">
                <Applications />
              </Route>
            </OidcSecure>
          ) : null
        }
      </Switch>
    </PageWrapper>
  );
}

export default App;
