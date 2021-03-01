import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { isClient } from 'react-use/lib/util';
import { OidcSecure } from '@axa-fr/react-oidc-context';
import PageWrapper from './component/PageWrapper';
import './i18n';
import './index.scss';
import './variables.css';
import Routes from './common/routes';
import Applications from './applications/Applications';
import Application from './application/Application';

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
        {isClient ? ( // client only routes
          <OidcSecure>
            <Route path="/application/:applicationRoundId/:applicationId">
              <Application />
            </Route>
            <Route path="/applications/">
              <Applications />
            </Route>
          </OidcSecure>
        ) : null}
      </Switch>
    </PageWrapper>
  );
}

export default App;
