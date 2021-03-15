import React, { useState } from "react";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
// eslint-disable-next-line import/no-unresolved
import { withOidcSecure } from "@axa-fr/react-oidc-context";
import Applications from "./component/Applications/Applications";
import ApplicationRound from "./component/ApplicationRound/ApplicationRound";
import PageWrapper from "./component/PageWrapper";
import "./i18n";
import { UIContext, UIContextType } from "./context/UIContext";
import Modal from "./component/Modal";
import Application from "./component/Applications/Application";
import ApplicationDetails from "./component/Applications/ApplicationDetails";
import Authenticating from "./component/Authentication/Authenticating";

interface IPrivateRouteProps {
  path: string;
  component: React.FunctionComponent;
  exact?: boolean;
}

function PrivateRoute({ component, ...rest }: IPrivateRouteProps): JSX.Element {
  return <Route {...rest} component={withOidcSecure(component)} />;
}

function App(): JSX.Element {
  const [modalContent, setModalContent] = useState<UIContextType | null>(null);

  const toggleModal = (content: UIContextType): void => {
    const bodyEl = document.getElementsByTagName("body")[0];
    const className = "noScroll";
    if (content) {
      bodyEl.classList.add(className);
    } else {
      bodyEl.classList.remove(className);
    }
    setModalContent(content);
  };

  return (
    <BrowserRouter>
      <UIContext.Provider
        value={{ modalContent: null, setModalContent: toggleModal }}
      >
        <PageWrapper>
          <Switch>
            <Route exact path="/foo">
              <Authenticating noNavigation />
            </Route>
            <Route exact path="/">
              <Redirect to="/applications" />
            </Route>
            <PrivateRoute exact path="/applications" component={Applications} />
            <PrivateRoute
              exact
              path="/application/:applicationId"
              component={Application}
            />
            <PrivateRoute
              exact
              path="/application/:applicationId/details"
              component={ApplicationDetails}
            />
            <PrivateRoute
              path="/applicationRound/:applicationRoundId"
              component={ApplicationRound}
            />
          </Switch>
        </PageWrapper>
        {modalContent && <Modal>{modalContent}</Modal>}
      </UIContext.Provider>
    </BrowserRouter>
  );
}

export default App;
