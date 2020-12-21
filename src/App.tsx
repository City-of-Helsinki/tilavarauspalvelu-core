import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './home/Home';
import Search from './search/Search';
import ReservationUnit from './reservation-unit/ReservationUnit';
import PageWrapper from './component/PageWrapper';
import './i18n';
import SelectionsListContextProvider from './context/SelectionsListContext';
import StartApplicationBar from './component/StartApplicationBar';
import Application from './application/Application';

function App(): JSX.Element {
  return (
    <Router>
      <PageWrapper>
        <Switch>
          <SelectionsListContextProvider>
            <Route exact path="/">
              <Home />
            </Route>
            <Route path="/search">
              <Search />
              <StartApplicationBar />
            </Route>
            <Route path="/reservation-unit/:id">
              <ReservationUnit />
              <StartApplicationBar />
            </Route>
            <Route path="/application/:applicationPeriodId/:applicationId">
              <Application />
            </Route>
          </SelectionsListContextProvider>
        </Switch>
      </PageWrapper>
    </Router>
  );
}

export default App;
