import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import dynamic from "next/dynamic";

import { Permission } from "app/modules/permissionHelper";
import ApplicationRound from "./spa/recurring-reservations/application-rounds/[id]";
import PageWrapper from "./component/PageWrapper";
import "./i18n";
import { PUBLIC_URL } from "./common/const";
import { GlobalContext } from "./context/GlobalContexts";
import { prefixes } from "./common/urls";
import AuthorizationChecker from "./common/AuthorizationChecker";

import MyUnitsRouter from "./component/my-units/MyUnitsRouter";
import ReservationsRouter from "./component/reservations/ReservationRouter";
import NotificationsRouter from "./component/notifications/router";
import Error404 from "./common/Error404";

const UNIT_PATH = "./component/Unit";
const Units = dynamic(() => import(`${UNIT_PATH}/Units`));
const Unit = dynamic(() => import(`${UNIT_PATH}/Unit`));
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

const ApplicationDetails = dynamic(
  () => import("./component/applications/ApplicationDetails")
);

const ReservationUnits = dynamic(
  () => import("./component/reservation-units/ReservationUnits")
);
const ReservationUnitEditor = dynamic(
  () => import("./spa/ReservationUnit/edit/index")
);

const HomePage = dynamic(() => import("./spa/HomePage"));

const AllApplicationRounds = dynamic(
  () => import(`./spa/recurring-reservations/application-rounds/index`)
);
const Criteria = dynamic(
  () => import(`./spa/recurring-reservations/application-rounds/[id]/criteria`)
);
const ApplicationRoundAllocation = dynamic(
  () =>
    import(`./spa/recurring-reservations/application-rounds/[id]/allocation`)
);

const withAuthorization = (
  component: JSX.Element,
  apiBaseUrl: string,
  permission?: Permission
) => (
  <AuthorizationChecker permission={permission} apiUrl={apiBaseUrl}>
    {component}
  </AuthorizationChecker>
);

type Props = {
  reservationUnitPreviewUrl: string;
  apiBaseUrl: string;
};
const UnitsRouter = ({
  reservationUnitPreviewUrl,
}: Pick<Props, "reservationUnitPreviewUrl">) => (
  <Routes>
    <Route path=":unitPk/spacesResources" element={<SpacesResources />} />
    <Route path=":unitPk/space/edit/:spacePk" element={<SpaceEditorView />} />
    <Route
      path=":unitPk/resource/edit/:resourcePk"
      element={<ResourceEditorView />}
    />
    <Route
      index
      path=":unitPk/reservationUnit/edit/"
      element={
        <ReservationUnitEditor previewUrlPrefix={reservationUnitPreviewUrl} />
      }
    />
    <Route
      path=":unitPk/reservationUnit/edit/:reservationUnitPk"
      element={
        <ReservationUnitEditor previewUrlPrefix={reservationUnitPreviewUrl} />
      }
    />
    <Route path=":unitPk" element={<Unit />} />
  </Routes>
);

const ApplicationRouter = () => (
  <Routes>
    <Route path=":applicationId" element={<ApplicationDetails />} />
    <Route path=":applicationId/details" element={<ApplicationDetails />} />
  </Routes>
);

const ApplicationRoundsRouter = () => (
  <Routes>
    <Route index element={<AllApplicationRounds />} />
    <Route path=":applicationRoundId/criteria" element={<Criteria />} />
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

function ClientApp({ reservationUnitPreviewUrl, apiBaseUrl }: Props) {
  return (
    <BrowserRouter basename={PUBLIC_URL}>
      <PageWrapper apiBaseUrl={apiBaseUrl}>
        <Routes>
          <Route path="*" element={<Error404 />} />
          <Route
            path="/"
            element={withAuthorization(<HomePage />, apiBaseUrl)}
          />
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
            element={withAuthorization(<PremisesRouter />, apiBaseUrl)}
          />
          <Route
            path="/unit/*"
            element={withAuthorization(
              <UnitsRouter
                reservationUnitPreviewUrl={reservationUnitPreviewUrl}
              />,
              apiBaseUrl
            )}
          />
          <Route
            path="/reservations/*"
            element={withAuthorization(<ReservationsRouter />, apiBaseUrl)}
          />
          <Route
            path="/my-units/*"
            element={withAuthorization(<MyUnitsRouter />, apiBaseUrl)}
          />
          <Route
            path="/messaging/notifications/*"
            element={withAuthorization(
              <NotificationsRouter />,
              Permission.CAN_MANAGE_BANNER_NOTIFICATIONS
            )}
          />
        </Routes>
      </PageWrapper>
    </BrowserRouter>
  );
}

export function App(props: Props) {
  if (typeof window === "undefined") {
    return null;
  }
  return (
    <GlobalContext>
      <ClientApp {...props} />
    </GlobalContext>
  );
}
