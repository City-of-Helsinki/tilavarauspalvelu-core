import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './App.css';
import Home from './frontpage/Home';
import PageWrapper from './component/PageWrapper';

function App(): JSX.Element {
  return (
    <Router>
      <PageWrapper>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route exact path="/page">
            <h1>Page</h1>
          </Route>
        </Switch>
      </PageWrapper>
    </Router>
  );
}

export default App;
