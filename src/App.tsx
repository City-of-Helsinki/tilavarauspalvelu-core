import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './home/Home';
import Search from './search/Search';
import ReservationUnit from './reservation-unit/ReservationUnit';
import PageWrapper from './component/PageWrapper';
import './i18n';
import SelectionsListContextProvider from './context/SelectionsListContext';
import StartApplicationBar from './component/StartApplicationBar';

function App(): JSX.Element {
  return (
    <SelectionsListContextProvider>
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
      <StartApplicationBar />
    </SelectionsListContextProvider>
  );
}

export default App;
