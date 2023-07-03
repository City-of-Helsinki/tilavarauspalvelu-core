import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Permission } from "app/context/permissionHelper";
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
import { GlobalContext } from "./context/GlobalContexts";

import { prefixes } from "./common/urls";
import ExternalScripts from "./common/ExternalScripts";
import ApplicationRoundAllocation from "./component/recurring-reservations/allocation/ApplicationRoundAllocation";
import MyUnitsRouter from "./component/my-units/MyUnitsRouter";
import ReservationsRouter from "./component/reservations/ReservationRouter";
import AuthorizationChecker from "./common/AuthorizationChecker";

const UnitsRouter = () => (
  <Routes>
    <Route path=":unitPk/map" element={<UnitMap />} />
    <Route path=":unitPk/spacesResources" element={<SpacesResources />} />
    <Route path=":unitPk/space/edit/:spacePk" element={<SpaceEditorView />} />
    <Route
      path=":unitPk/resource/edit/:resourcePk"
      element={<ResourceEditorView />}
    />
    <Route
      index
      path=":unitPk/reservationUnit/edit/"
      element={<ReservationUnitEditor />}
    />
    <Route
      path=":unitPk/reservationUnit/edit/:reservationUnitPk"
      element={<ReservationUnitEditor />}
    />
    <Route path=":unitPk" element={<Unit />} />
  </Routes>
);

const ApplicationRouter = () => (
  <Routes>
    <Route path=":applicationId" element={<Application />} />
    <Route path=":applicationId/details" element={<ApplicationDetails />} />
    <Route
      path=":applicationId/recurringReservation/:recurringReservationId"
      element={<ReservationByApplicationEvent />}
    />
  </Routes>
);

const ApplicationRoundsRouter = () => (
  <Routes>
    <Route index element={<AllApplicationRounds />} />
    <Route path=":applicationRoundId/applications" element={<Applications />} />
    <Route
      path=":applicationRoundId/resolution"
      element={<ResolutionReport />}
    />
    <Route path=":applicationRoundId/criteria" element={<Criteria />} />
    <Route
      path=":applicationRoundId/reservationUnit/:reservationUnitId/reservations/summary"
      element={<ReservationSummariesByReservationUnit />}
    />
    <Route
      path=":applicationRoundId/reservationUnit/:reservationUnitId/reservations"
      element={<ReservationsByReservationUnit />}
    />
    <Route
      path=":applicationRoundId/reservationUnit/:reservationUnitId"
      element={<RecommendationsByReservationUnit />}
    />
    <Route
      path=":applicationRoundId/applicant/:applicantId"
      element={<RecommendationsByApplicant />}
    />
    <Route
      path=":applicationRoundId/organisation/:organisationId"
      element={<RecommendationsByApplicant />}
    />
    <Route
      path=":applicationRoundId/recommendation/:applicationEventScheduleId"
      element={<Recommendation />}
    />
    <Route
      path=":applicationRoundId/allocation"
      element={<ApplicationRoundAllocation />}
    />
    <Route path=":applicationRoundId" element={<ApplicationRound />} />
  </Routes>
);

const PremisesRouter = () => (
  <Routes>
    <Route
      path="spaces"
      element={
        <AuthorizationChecker permission={Permission.CAN_MANAGE_SPACES}>
          <SpacesList />
        </AuthorizationChecker>
      }
    />
    <Route
      path={`${prefixes.reservationUnits}`}
      element={
        <AuthorizationChecker permission={Permission.CAN_MANAGE_UNITS}>
          <ReservationUnits />
        </AuthorizationChecker>
      }
    />
    <Route
      path="resources"
      element={
        <AuthorizationChecker permission={Permission.CAN_MANAGE_RESOURCES}>
          <ResourcesList />
        </AuthorizationChecker>
      }
    />
    <Route
      path="units"
      element={
        <AuthorizationChecker permission={Permission.CAN_MANAGE_UNITS}>
          <Units />
        </AuthorizationChecker>
      }
    />
  </Routes>
);

const App = () => {
  return (
    <BrowserRouter basename={publicUrl}>
      <PageWrapper>
        <Routes>
          <Route
            path="/"
            element={
              <AuthorizationChecker>
                <ApplicationRounds />
              </AuthorizationChecker>
            }
          />

          <Route
            path={`${prefixes.applications}/*`}
            element={
              <AuthorizationChecker
                permission={Permission.CAN_VALIDATE_APPLICATIONS}
              >
                <ApplicationRouter />
              </AuthorizationChecker>
            }
          />

          <Route
            path={`${prefixes.recurringReservations}/application-rounds/*`}
            element={
              <AuthorizationChecker
                permission={Permission.CAN_VALIDATE_APPLICATIONS}
              >
                <ApplicationRoundsRouter />
              </AuthorizationChecker>
            }
          />

          <Route
            path="/premises-and-settings/*"
            element={
              <AuthorizationChecker>
                <PremisesRouter />
              </AuthorizationChecker>
            }
          />

          <Route
            path="/unit/*"
            element={
              <AuthorizationChecker>
                <UnitsRouter />
              </AuthorizationChecker>
            }
          />
          <Route
            path="/reservations/*"
            element={
              <AuthorizationChecker>
                <ReservationsRouter />
              </AuthorizationChecker>
            }
          />
          <Route
            path="/my-units/*"
            element={
              <AuthorizationChecker>
                <MyUnitsRouter />
              </AuthorizationChecker>
            }
          />
        </Routes>
        <ExternalScripts />
      </PageWrapper>
    </BrowserRouter>
  );
};

const ContextWrapped = () => (
  <GlobalContext>
    <App />
  </GlobalContext>
);

const AppWrapper = () => {
  if (typeof document === "undefined") {
    return null;
  }
  if (typeof window === "undefined") {
    return null;
  }
  return <ContextWrapped />;
};

export default AppWrapper;
