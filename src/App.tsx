import React, { useState } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
// eslint-disable-next-line import/no-unresolved
import { withOidcSecure, useReactOidc } from "@axa-fr/react-oidc-context";
import ApplicationRound from "./component/ApplicationRound/ApplicationRound";
import PageWrapper from "./component/PageWrapper";
import "./i18n";
import { UIContext, UIContextType } from "./context/UIContext";
import Modal from "./component/Modal";
import Application from "./component/Application/Application";
import ApplicationDetails from "./component/Application/ApplicationDetails";
import Recommendation from "./component/ApplicationRound/Recommendation";
import RecommendationsByApplicant from "./component/ApplicationRound/RecommendationsByApplicant";
import ApplicationRounds from "./component/ApplicationRound/ApplicationRounds";
import AllApplicationRounds from "./component/ApplicationRound/AllApplicationRounds";
import MainLander from "./component/MainLander";
import Approval from "./component/ApplicationRound/Approval";
import Applications from "./component/Application/Applications";
import Criteria from "./component/ApplicationRound/Criteria";
import RecommendationsByReservationUnit from "./component/ApplicationRound/RecommendationsByReservationUnit";
import ApplicationRoundApprovals from "./component/ApplicationRound/ApplicationRoundApprovals";
import { publicUrl } from "./common/const";
import ResolutionReport from "./component/ApplicationRound/ResolutionReport";

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
    const classes = ["noScroll"];
    if (
      window.document.body.scrollHeight >
      window.document.documentElement.clientHeight
    ) {
      classes.push("scrollbarActive");
    }
    if (content) {
      bodyEl.classList.add(...classes);
    } else {
      bodyEl.classList.remove(...classes);
    }
    setModalContent(content);
  };

  return (
    <BrowserRouter basename={publicUrl}>
      <UIContext.Provider
        value={{
          modalContent: null,
          setModalContent: toggleModal,
        }}
      >
        <PageWrapper>
          <Switch>
            <Route
              exact
              path="/"
              component={oidcUser ? ApplicationRounds : MainLander}
            />
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
              component={AllApplicationRounds}
            />
            <PrivateRoute
              exact
              path="/applicationRounds/approvals"
              component={ApplicationRoundApprovals}
            />
            <PrivateRoute
              path="/applicationRound/:applicationRoundId/applications"
              component={Applications}
            />
            <PrivateRoute
              path="/applicationRound/:applicationRoundId/resolution"
              component={ResolutionReport}
            />
            <PrivateRoute
              path="/applicationRound/:applicationRoundId/criteria"
              component={Criteria}
            />
            <PrivateRoute
              path="/applicationRound/:applicationRoundId/reservationUnit/:reservationUnitId"
              component={RecommendationsByReservationUnit}
            />
            <PrivateRoute
              path="/applicationRound/:applicationRoundId/applicant/:applicantId"
              component={RecommendationsByApplicant}
            />
            <PrivateRoute
              path="/applicationRound/:applicationRoundId/recommendation/:applicationEventScheduleId"
              component={Recommendation}
            />
            <PrivateRoute
              path="/applicationRound/:applicationRoundId/approval"
              component={Approval}
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
