import React, { useState } from "react";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
// eslint-disable-next-line import/no-unresolved
import { withOidcSecure, useReactOidc } from "@axa-fr/react-oidc-context";
import Applications from "./component/Application/Applications";
import ApplicationRound from "./component/ApplicationRound/ApplicationRound";
import PageWrapper from "./component/PageWrapper";
import "./i18n";
import { UIContext, UIContextType } from "./context/UIContext";
import Modal from "./component/Modal";
import Application from "./component/Application/Application";
import ApplicationDetails from "./component/Application/ApplicationDetails";
import Recommendation from "./component/ApplicationRound/Recommendation";
import RecommendationsBySpace from "./component/ApplicationRound/RecommendationsBySpace";
import RecommendationsByApplicant from "./component/ApplicationRound/RecommendationsByApplicant";
import ApplicationRounds from "./component/ApplicationRound/ApplicationRounds";
import MainLander from "./component/MainLander";

interface IPrivateRouteProps {
  path: string;
  component: React.FunctionComponent;
  exact?: boolean;
}

function PrivateRoute({ component, ...rest }: IPrivateRouteProps): JSX.Element {
  return <Route {...rest} component={withOidcSecure(component)} />;
}

function App(): JSX.Element {
  const { oidcUser } = useReactOidc();

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
            <Route exact path="/">
              {oidcUser && <Redirect to="/applicationRounds" />}
              <MainLander />
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
              exact
              path="/applicationRounds"
              component={ApplicationRounds}
            />
            <PrivateRoute
              path="/applicationRound/:applicationRoundId/space/:spaceId"
              component={RecommendationsBySpace}
            />
            <PrivateRoute
              path="/applicationRound/:applicationRoundId/applicant/:applicationId"
              component={RecommendationsByApplicant}
            />
            <PrivateRoute
              path="/applicationRound/:applicationRoundId/recommendation/:recommendationId"
              component={Recommendation}
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
