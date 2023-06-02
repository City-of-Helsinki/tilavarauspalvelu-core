import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ApplicationRound from "./component/recurring-reservations/ApplicationRound";
import PageWrapper from "./component/PageWrapper";
import "./i18n";
import Application from "./component/applications/Application";
import ApplicationDetails from "./component/applications/ApplicationDetails";
import Recommendation from "./component/recurring-reservations/Recommendation";
import RecommendationsByApplicant from "./component/recurring-reservations/RecommendationsByApplicant";
import ApplicationRounds from "./component/recurring-reservations/ApplicationRounds";
import AllApplicationRounds from "./component/recurring-reservations/AllApplicationRounds";
import Applications from "./component/applications/Applications";
import Criteria from "./component/recurring-reservations/Criteria";
import RecommendationsByReservationUnit from "./component/recurring-reservations/RecommendationsByReservationUnit";
import { publicUrl } from "./common/const";
import ResolutionReport from "./component/recurring-reservations/ResolutionReport";
import ReservationsByReservationUnit from "./component/recurring-reservations/ReservationsByReservationUnit";
import ReservationSummariesByReservationUnit from "./component/recurring-reservations/ReservationSummariesByReservationUnit";
import ReservationByApplicationEvent from "./component/applications/ReservationByApplicationEvent";
import SpacesList from "./component/Spaces/SpacesList";
import Units from "./component/Unit/Units";
import Unit from "./component/Unit/Unit";
import UnitMap from "./component/Unit/UnitMap";
import SpacesResources from "./component/Unit/SpacesResources";
import SpaceEditorView from "./component/Spaces/space-editor/SpaceEditorView";
import ResourceEditorView from "./component/Resources/resource-editor/ResourceEditorView";
import ReservationUnitEditor from "./component/ReservationUnits/ReservationUnitEditor/ReservationUnitEditor";
import ResourcesList from "./component/Resources/ResourcesList";
import ReservationUnits from "./component/reservation-units/ReservationUnits";
import { withGlobalContext } from "./context/GlobalContexts";

import { prefixes } from "./common/urls";
import ExternalScripts from "./common/ExternalScripts";
import ApplicationRoundAllocation from "./component/recurring-reservations/allocation/ApplicationRoundAllocation";
import { PrivateRoute } from "./common/PrivateRoutes";
import MyUnitsRouter from "./component/my-units/MyUnitsRouter";
import ReservationsRouter from "./component/reservations/ReservationRouter";

const App = () => {
  return (
    <BrowserRouter basename={publicUrl}>
      <PageWrapper>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <ApplicationRounds />
              </PrivateRoute>
            }
          />

          <Route
            path={`${prefixes.applications}/:applicationId`}
            element={
              <PrivateRoute>
                <Application />
              </PrivateRoute>
            }
          />
          <Route
            path={`${prefixes.applications}/:applicationId/details`}
            element={
              <PrivateRoute>
                <ApplicationDetails />
              </PrivateRoute>
            }
          />
          <Route
            path={`${prefixes.applications}/:applicationId/recurringReservation/:recurringReservationId`}
            element={
              <PrivateRoute>
                <ReservationByApplicationEvent />
              </PrivateRoute>
            }
          />
          <Route
            path={`${prefixes.recurringReservations}/application-rounds`}
            element={
              <PrivateRoute>
                <AllApplicationRounds />
              </PrivateRoute>
            }
          />
          <Route
            path={`${prefixes.recurringReservations}/application-rounds/:applicationRoundId/applications`}
            element={
              <PrivateRoute>
                <Applications />
              </PrivateRoute>
            }
          />
          <Route
            path={`${prefixes.recurringReservations}/application-rounds/:applicationRoundId/resolution`}
            element={
              <PrivateRoute>
                <ResolutionReport />
              </PrivateRoute>
            }
          />
          <Route
            path={`${prefixes.recurringReservations}/application-rounds/:applicationRoundId/criteria`}
            element={
              <PrivateRoute>
                <Criteria />
              </PrivateRoute>
            }
          />
          <Route
            path={`${prefixes.recurringReservations}/application-rounds/:applicationRoundId/reservationUnit/:reservationUnitId/reservations/summary`}
            element={
              <PrivateRoute>
                <ReservationSummariesByReservationUnit />
              </PrivateRoute>
            }
          />
          <Route
            path={`${prefixes.recurringReservations}/application-rounds/:applicationRoundId/reservationUnit/:reservationUnitId/reservations`}
            element={
              <PrivateRoute>
                <ReservationsByReservationUnit />
              </PrivateRoute>
            }
          />
          <Route
            path={`${prefixes.recurringReservations}/application-rounds/:applicationRoundId/reservationUnit/:reservationUnitId`}
            element={
              <PrivateRoute>
                <RecommendationsByReservationUnit />
              </PrivateRoute>
            }
          />
          <Route
            path={`${prefixes.recurringReservations}/application-rounds/:applicationRoundId/applicant/:applicantId`}
            element={
              <PrivateRoute>
                <RecommendationsByApplicant />
              </PrivateRoute>
            }
          />
          <Route
            path={`${prefixes.recurringReservations}/application-rounds/:applicationRoundId/organisation/:organisationId`}
            element={
              <PrivateRoute>
                <RecommendationsByApplicant />
              </PrivateRoute>
            }
          />
          <Route
            path={`${prefixes.recurringReservations}/application-rounds/:applicationRoundId/recommendation/:applicationEventScheduleId`}
            element={
              <PrivateRoute>
                <Recommendation />
              </PrivateRoute>
            }
          />
          <Route
            path={`${prefixes.recurringReservations}/application-rounds/:applicationRoundId/allocation`}
            element={
              <PrivateRoute>
                <ApplicationRoundAllocation />
              </PrivateRoute>
            }
          />
          <Route
            path={`${prefixes.recurringReservations}/application-rounds/:applicationRoundId`}
            element={
              <PrivateRoute>
                <ApplicationRound />
              </PrivateRoute>
            }
          />
          <Route
            path="/premises-and-settings/spaces"
            element={
              <PrivateRoute>
                <SpacesList />
              </PrivateRoute>
            }
          />
          <Route
            path={`/premises-and-settings${prefixes.reservationUnits}`}
            element={
              <PrivateRoute>
                <ReservationUnits />
              </PrivateRoute>
            }
          />
          <Route
            path="/premises-and-settings/resources"
            element={
              <PrivateRoute>
                <ResourcesList />
              </PrivateRoute>
            }
          />
          <Route
            path="/premises-and-settings/units"
            element={
              <PrivateRoute>
                <Units />
              </PrivateRoute>
            }
          />
          <Route
            path="/unit/:unitPk/map"
            element={
              <PrivateRoute>
                <UnitMap />
              </PrivateRoute>
            }
          />
          <Route
            path="/unit/:unitPk/spacesResources"
            element={
              <PrivateRoute>
                <SpacesResources />
              </PrivateRoute>
            }
          />
          <Route
            path="/unit/:unitPk/space/edit/:spacePk"
            element={
              <PrivateRoute>
                <SpaceEditorView />
              </PrivateRoute>
            }
          />
          <Route
            path="/unit/:unitPk/resource/edit/:resourcePk"
            element={
              <PrivateRoute>
                <ResourceEditorView />
              </PrivateRoute>
            }
          />
          <Route
            path="/unit/:unitPk/reservationUnit/edit/:reservationUnitPk?"
            element={
              <PrivateRoute>
                <ReservationUnitEditor />
              </PrivateRoute>
            }
          />
          <Route
            path="/unit/:unitPk"
            element={
              <PrivateRoute>
                <Unit />
              </PrivateRoute>
            }
          />
          <Route
            path="/reservations/*"
            element={
              <PrivateRoute>
                <ReservationsRouter />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-units/*"
            element={
              <PrivateRoute>
                <MyUnitsRouter />
              </PrivateRoute>
            }
          />
        </Routes>
        <ExternalScripts />
      </PageWrapper>
    </BrowserRouter>
  );
};

export default withGlobalContext(App);
