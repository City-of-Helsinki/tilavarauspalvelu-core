import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { useReactOidc } from "@axa-fr/react-oidc-context";
import ApplicationRound from "./component/ApplicationRound/ApplicationRound";
import PageWrapper from "./component/PageWrapper";
import "./i18n";
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
import SpaceEditorView from "./component/Spaces/space-editor/SpaceEditorView";
import ResourceEditorView from "./component/Resources/resource-editor/ResourceEditorView";
import ReservationUnitEditor from "./component/ReservationUnits/ReservationUnitEditor";
import ResourcesList from "./component/Resources/ResourcesList";
import ReservationUnitsList from "./component/ReservationUnits/ReservationUnitsList";
import ReservationUnitsSearch from "./component/ReservationUnits/ReservationUnitsSearch";
import { withGlobalContext } from "./context/GlobalContexts";

import { SingleApplications } from "./component/SingleApplications";
import SingleApplication from "./component/SingleApplications/SingleApplication";
import PrivateRoutes from "./common/PrivateRoutes";

function App(): JSX.Element {
  const { oidcUser } = useReactOidc();

  return (
    <BrowserRouter basename={publicUrl}>
      <PageWrapper>
        <Switch>
          <Route
            exact
            path="/"
            component={oidcUser ? ApplicationRounds : MainLander}
          />
          <PrivateRoutes>
            <Route
              exact
              path="/application/:applicationId"
              component={Application}
            />
            <Route
              exact
              path="/application/:applicationId/details"
              component={ApplicationDetails}
            />
            <Route
              exact
              path="/application/:applicationId/recurringReservation/:recurringReservationId"
              component={ReservationByApplicationEvent}
            />
            <Route
              exact
              path="/applicationRounds"
              component={AllApplicationRounds}
            />
            <Route
              exact
              path="/applicationRounds/approvals"
              component={ApplicationRoundApprovals}
            />
            <Route
              path="/applicationRound/:applicationRoundId/applications"
              component={Applications}
              exact
            />
            <Route
              path="/applicationRound/:applicationRoundId/resolution"
              component={ResolutionReport}
              exact
            />
            <Route
              path="/applicationRound/:applicationRoundId/criteria"
              component={Criteria}
              exact
            />
            <Route
              path="/applicationRound/:applicationRoundId/reservationUnit/:reservationUnitId/reservations/summary"
              component={ReservationSummariesByReservationUnit}
            />
            <Route
              path="/applicationRound/:applicationRoundId/reservationUnit/:reservationUnitId/reservations"
              component={ReservationsByReservationUnit}
            />
            <Route
              path="/applicationRound/:applicationRoundId/reservationUnit/:reservationUnitId"
              component={RecommendationsByReservationUnit}
            />
            <Route
              path="/applicationRound/:applicationRoundId/applicant/:applicantId"
              component={RecommendationsByApplicant}
            />
            <Route
              path="/applicationRound/:applicationRoundId/organisation/:organisationId"
              component={RecommendationsByApplicant}
            />
            <Route
              path="/applicationRound/:applicationRoundId/recommendation/:applicationEventScheduleId"
              component={Recommendation}
            />
            <Route
              path="/applicationRound/:applicationRoundId/approval"
              component={Approval}
              exact
            />
            <Route
              path="/applicationRound/:applicationRoundId"
              component={ApplicationRound}
              exact
            />
            <Route path="/spaces" component={SpacesList} />
            <Route
              path="/reservationUnits"
              component={ReservationUnitsList}
              exact
            />
            <Route
              path="/reservationUnits/search"
              component={ReservationUnitsSearch}
            />
            <Route path="/resources" component={ResourcesList} />
            <Route path="/units" component={Units} />
            <Route path="/unit/:unitPk/map" component={UnitMap} />
            <Route
              path="/unit/:unitPk/spacesResources"
              component={SpacesResources}
              exact
            />
            <Route
              path="/unit/:unitPk/space/edit/:spacePk"
              component={SpaceEditorView}
            />
            <Route
              path="/unit/:unitPk/resource/edit/:resourcePk"
              component={ResourceEditorView}
            />
            <Route
              path="/unit/:unitPk/reservationUnit/edit/:reservationUnitPk?"
              component={ReservationUnitEditor}
            />
            <Route path="/unit/:unitPk" component={Unit} exact />
            <Route
              path="/singleApplications/:reservationPk"
              component={SingleApplication}
              exact
            />
            <Route
              path="/singleApplications"
              exact
              component={SingleApplications}
            />
          </PrivateRoutes>
        </Switch>
      </PageWrapper>
    </BrowserRouter>
  );
}

export default withGlobalContext(App);
