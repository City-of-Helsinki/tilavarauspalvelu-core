import React from 'react';
import { Route, Switch } from 'react-router-dom';
import PageWrapper from './component/PageWrapper';
import './i18n';
import './index.scss';
import './variables.css';
import Routes from './common/routes';
import Applications from './applications/Applications';
import Reservations from './applications/Reservations';
import Application from './application/Application';
import { isBrowser } from './common/const';
import Intro from './application/intro/Intro';
import EventReservationUnitDetails from './applications/EventReservationUnitDetails';

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
            <>
              <Route path="/intro">
                <Intro />
              </Route>
              <OidcSecure>
                <Route path="/application/:applicationId">
                  <Application />
                </Route>
                <Route path="/applications/" exact>
                  <Applications />
                </Route>
                <Route path="/applications/:applicationId" exact>
                  <Reservations />
                </Route>
                <Route
                  path="/applications/details/:applicationId/:eventId/:reservationUnitId"
                  exact>
                  <EventReservationUnitDetails />
                </Route>
              </OidcSecure>
            </>
          ) : null
        }
      </Switch>
    </PageWrapper>
  );
}

export default App;
