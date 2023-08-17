import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import dynamic from "next/dynamic";

import { Permission } from "app/modules/permissionHelper";
import ApplicationRound from "./component/recurring-reservations/ApplicationRound";
import PageWrapper from "./component/PageWrapper";
import "./i18n";
import { publicUrl } from "./common/const";
import { GlobalContext } from "./context/GlobalContexts";
import { prefixes } from "./common/urls";
import ExternalScripts from "./common/ExternalScripts";
import AuthorizationChecker from "./common/AuthorizationChecker";

import MyUnitsRouter from "./component/my-units/MyUnitsRouter";
import ReservationsRouter from "./component/reservations/ReservationRouter";

const UNIT_PATH = "./component/Unit";
const Units = dynamic(() => import(`${UNIT_PATH}/Units`));
const Unit = dynamic(() => import(`${UNIT_PATH}/Unit`));
const UnitMap = dynamic(() => import(`${UNIT_PATH}/UnitMap`));
const SpacesResources = dynamic(import(`${UNIT_PATH}/SpacesResources`));

const SpacesList = dynamic(() => import("./component/Spaces/SpacesList"));
const SpaceEditorView = dynamic(
  () => import("./component/Spaces/space-editor/SpaceEditorView")
);

const ResourcesList = dynamic(
  () => import("./component/Resources/ResourcesList")
);
const ResourceEditorView = dynamic(
  () => import("./component/Resources/resource-editor/ResourceEditorView")
);

const APPLICATIONS_PATH = "./component/applications";
const Application = dynamic(() => import(`${APPLICATIONS_PATH}/Application`));
const Applications = dynamic(() => import(`${APPLICATIONS_PATH}/Applications`));
const ApplicationDetails = dynamic(
  () => import(`${APPLICATIONS_PATH}/ApplicationDetails`)
);
const ReservationByApplicationEvent = dynamic(
  () => import(`${APPLICATIONS_PATH}/ReservationByApplicationEvent`)
);

const ReservationUnits = dynamic(
  () => import("./component/reservation-units/ReservationUnits")
);
const ReservationUnitEditor = dynamic(
  () =>
    import(
      "./component/ReservationUnits/ReservationUnitEditor/ReservationUnitEditor"
    )
);

const RECURRING_PATH = "./component/recurring-reservations";
const Recommendation = dynamic(
  () => import(`${RECURRING_PATH}/Recommendation`)
);
const RecommendationsByApplicant = dynamic(
  () => import(`${RECURRING_PATH}/RecommendationsByApplicant`)
);
const ApplicationRounds = dynamic(
  () => import(`${RECURRING_PATH}/ApplicationRounds`)
);
const AllApplicationRounds = dynamic(
  () => import(`${RECURRING_PATH}/AllApplicationRounds`)
);
const Criteria = dynamic(() => import(`${RECURRING_PATH}/Criteria`));
const RecommendationsByReservationUnit = dynamic(
  () => import(`${RECURRING_PATH}/RecommendationsByReservationUnit`)
);
const ResolutionReport = dynamic(
  () => import(`${RECURRING_PATH}/ResolutionReport`)
);
const ReservationsByReservationUnit = dynamic(
  () => import(`${RECURRING_PATH}/ReservationsByReservationUnit`)
);
const ReservationSummariesByReservationUnit = dynamic(
  () => import(`${RECURRING_PATH}/ReservationSummariesByReservationUnit`)
);
const ApplicationRoundAllocation = dynamic(
  () => import(`${RECURRING_PATH}/allocation/ApplicationRoundAllocation`)
);

const withAuthorization = (component: JSX.Element, permission?: Permission) => (
  <AuthorizationChecker permission={permission}>
    {component}
  </AuthorizationChecker>
);

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
      element={withAuthorization(<SpacesList />, Permission.CAN_MANAGE_SPACES)}
    />
    <Route
      path={`${prefixes.reservationUnits}`}
      element={withAuthorization(
        <ReservationUnits />,
        Permission.CAN_MANAGE_UNITS
      )}
    />
    <Route
      path="resources"
      element={withAuthorization(
        <ResourcesList />,
        Permission.CAN_MANAGE_RESOURCES
      )}
    />
    <Route
      path="units"
      element={withAuthorization(<Units />, Permission.CAN_MANAGE_UNITS)}
    />
  </Routes>
);

const App = () => {
  return (
    <BrowserRouter basename={publicUrl}>
      <PageWrapper>
        <Routes>
          <Route path="/" element={withAuthorization(<ApplicationRounds />)} />

          <Route
            path={`${prefixes.applications}/*`}
            element={withAuthorization(
              <ApplicationRouter />,
              Permission.CAN_VALIDATE_APPLICATIONS
            )}
          />

          <Route
            path={`${prefixes.recurringReservations}/application-rounds/*`}
            element={withAuthorization(
              <ApplicationRoundsRouter />,
              Permission.CAN_VALIDATE_APPLICATIONS
            )}
          />

          <Route
            path="/premises-and-settings/*"
            element={withAuthorization(<PremisesRouter />)}
          />

          <Route path="/unit/*" element={withAuthorization(<UnitsRouter />)} />
          <Route
            path="/reservations/*"
            element={withAuthorization(<ReservationsRouter />)}
          />
          <Route
            path="/my-units/*"
            element={withAuthorization(<MyUnitsRouter />)}
          />
        </Routes>
        <ExternalScripts />
      </PageWrapper>
    </BrowserRouter>
  );
};

const AppWrapper = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return (
    <GlobalContext>
      <App />
    </GlobalContext>
  );
};

export default AppWrapper;
