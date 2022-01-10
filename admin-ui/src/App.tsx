import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
// eslint-disable-next-line import/no-unresolved
import { useReactOidc } from "@axa-fr/react-oidc-context";
import { ApolloProvider } from "@apollo/client";
import apolloClient from "./common/apolloClient";
import ApplicationRound from "./component/ApplicationRound/ApplicationRound";
import PageWrapper from "./component/PageWrapper";
import "./i18n";
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
import ReservationsByReservationUnit from "./component/ApplicationRound/ReservationsByReservationUnit";
import ReservationSummariesByReservationUnit from "./component/ApplicationRound/ReservationSummariesByReservationUnit";
import ReservationByApplicationEvent from "./component/Application/ReservationByApplicationEvent";
import SpacesList from "./component/Spaces/SpacesList";
import Units from "./component/Unit/Units";
import Unit from "./component/Unit/Unit";
import UnitMap from "./component/Unit/UnitMap";
import SpacesResources from "./component/Unit/SpacesResources";
import SpaceEditor from "./component/Spaces/SpaceEditor";
import ResourceEditor from "./component/Resources/ResourceEditor";
import ReservationUnitEditor from "./component/ReservationUnits/ReservationUnitEditor";
import ResourcesList from "./component/Resources/ResourcesList";
import ReservationUnitsList from "./component/ReservationUnits/ReservationUnitsList";
import ReservationUnitsSearch from "./component/ReservationUnits/ReservationUnitsSearch";
import { withGlobalContext } from "./context/GlobalContexts";
import { useModal } from "./context/ModalContext";
import PrivateRoute from "./common/PrivateRoute";

function App(): JSX.Element {
  const { oidcUser } = useReactOidc();
  const { modalContent } = useModal();

  return (
    <BrowserRouter basename={publicUrl}>
      <ApolloProvider client={apolloClient}>
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
              path="/application/:applicationId/recurringReservation/:recurringReservationId"
              component={ReservationByApplicationEvent}
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
              path="/applicationRound/:applicationRoundId/reservationUnit/:reservationUnitId/reservations/summary"
              component={ReservationSummariesByReservationUnit}
            />
            <PrivateRoute
              path="/applicationRound/:applicationRoundId/reservationUnit/:reservationUnitId/reservations"
              component={ReservationsByReservationUnit}
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
              path="/applicationRound/:applicationRoundId/organisation/:organisationId"
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
            <PrivateRoute path="/spaces" component={SpacesList} />
            <PrivateRoute
              path="/reservationUnits"
              component={ReservationUnitsList}
              exact
            />
            <PrivateRoute
              path="/reservationUnits/search"
              component={ReservationUnitsSearch}
            />
            <PrivateRoute path="/resources" component={ResourcesList} />
            <PrivateRoute path="/units" component={Units} />
            <PrivateRoute path="/unit/:unitPk/map" component={UnitMap} />
            <PrivateRoute
              path="/unit/:unitPk/spacesResources"
              component={SpacesResources}
            />
            <PrivateRoute
              path="/unit/:unitPk/space/edit/:spacePk"
              component={SpaceEditor}
            />
            <PrivateRoute
              path="/unit/:unitPk/resource/edit/:resourcePk"
              component={ResourceEditor}
            />
            <PrivateRoute
              path="/unit/:unitPk/reservationUnit/edit/:reservationUnitPk?"
              component={ReservationUnitEditor}
            />
            <PrivateRoute path="/unit/:unitPk" component={Unit} />
          </Switch>
        </PageWrapper>
        {modalContent && <Modal>{modalContent}</Modal>}
      </ApolloProvider>
    </BrowserRouter>
  );
}

export default withGlobalContext(App);
