import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './home/Home';
import Search from './search/Search';
import ReservationUnit from './reservation-unit/ReservationUnit';
import PageWrapper from './component/PageWrapper';
import './i18n';

function App(): JSX.Element {
  return (
    <Router>
      <PageWrapper>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/search">
            <Search />
          </Route>
          <Route path="/reservation-unit/:id">
            <ReservationUnit />
          </Route>
        </Switch>
      </PageWrapper>
    </Router>
  );
}

export default App;
