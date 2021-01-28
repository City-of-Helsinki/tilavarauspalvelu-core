import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import IndividualApplicationList from "./component/Applications/Individual/IndividualApplicationList";
import PageWrapper from "./component/PageWrapper";
import "./i18n";

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <PageWrapper>
        <Switch>
          <Route exact path="/">
            <IndividualApplicationList content="1" />
          </Route>
          <Route path="/foo">
            <IndividualApplicationList content="2" />
          </Route>
          <Route path="/bar">
            <IndividualApplicationList content="3" />
          </Route>
          <Route path="/baz">
            <IndividualApplicationList content="4" />
          </Route>
        </Switch>
      </PageWrapper>
    </BrowserRouter>
  );
}

export default App;
