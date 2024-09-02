import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import dynamic from "next/dynamic";
import ApplicationRound from "./spa/recurring-reservations/application-rounds/[id]";
import PageWrapper from "./component/PageWrapper";
import "./i18n";
import { PUBLIC_URL } from "./common/const";
import { GlobalContext } from "./context/GlobalContexts";
import { prefixes } from "./common/urls";
import { withAuthorization } from "@/common/AuthorizationChecker";
import MyUnitsRouter from "./spa/my-units/router";
import ReservationsRouter from "./spa/reservations/router";
import NotificationsRouter from "./spa/notifications/router";
import Error404 from "./common/Error404";
import { UserPermissionChoice } from "@gql/gql-types";

const Units = dynamic(() => import("./spa/unit"));
const Unit = dynamic(() => import("./spa/unit/[id]"));
const SpacesResources = dynamic(import("./spa/unit/SpacesResources"));

const SpacesList = dynamic(() => import("./spa/spaces"));
const SpaceEditorView = dynamic(
  () => import("./spa/unit/space-editor/SpaceEditorView")
);

const ResourcesList = dynamic(() => import("./spa/resources"));
const ResourceEditorView = dynamic(
  () => import("./spa/unit/resource-editor/ResourceEditorView")
);

const ApplicationDetails = dynamic(
  () => import("./spa/applications/[id]/index")
);

const ReservationUnits = dynamic(
  () => import("./spa/reservation-units/ReservationUnits")
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

type Props = {
  reservationUnitPreviewUrl: string;
  apiBaseUrl: string;
  feedbackUrl: string;
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
      path=":applicationRoundPk/allocation"
      element={<ApplicationRoundAllocation />}
    />
    <Route path=":applicationRoundId" element={<ApplicationRound />} />
  </Routes>
);

const PremisesRouter = ({
  apiBaseUrl,
  feedbackUrl,
}: Omit<Props, "reservationUnitPreviewUrl">) => (
  <Routes>
    <Route
      path="spaces"
      element={withAuthorization(
        <SpacesList />,
        apiBaseUrl,
        feedbackUrl,
        UserPermissionChoice.CanManageReservationUnits
      )}
    />
    <Route
      path={prefixes.reservationUnits}
      element={withAuthorization(
        <ReservationUnits />,
        apiBaseUrl,
        feedbackUrl,
        UserPermissionChoice.CanManageReservationUnits
      )}
    />
    <Route
      path="resources"
      element={withAuthorization(
        <ResourcesList />,
        apiBaseUrl,
        feedbackUrl,
        UserPermissionChoice.CanManageReservationUnits
      )}
    />
    <Route
      path="units"
      element={withAuthorization(
        <Units />,
        apiBaseUrl,
        feedbackUrl,
        UserPermissionChoice.CanManageReservationUnits
      )}
    />
  </Routes>
);

function ClientApp({
  reservationUnitPreviewUrl,
  apiBaseUrl,
  feedbackUrl,
}: Props) {
  return (
    <BrowserRouter basename={PUBLIC_URL}>
      <PageWrapper apiBaseUrl={apiBaseUrl} feedbackUrl={feedbackUrl}>
        <Routes>
          <Route path="*" element={<Error404 />} />
          <Route
            path="/"
            element={withAuthorization(<HomePage />, apiBaseUrl, feedbackUrl)}
          />
          <Route
            path={`${prefixes.applications}/*`}
            element={withAuthorization(
              <ApplicationRouter />,
              apiBaseUrl,
              feedbackUrl,
              UserPermissionChoice.CanManageApplications
            )}
          />
          <Route
            path={`${prefixes.recurringReservations}/application-rounds/*`}
            element={withAuthorization(
              <ApplicationRoundsRouter />,
              apiBaseUrl,
              feedbackUrl,
              UserPermissionChoice.CanManageApplications
            )}
          />
          <Route
            path="/premises-and-settings/*"
            element={withAuthorization(
              <PremisesRouter
                apiBaseUrl={apiBaseUrl}
                feedbackUrl={feedbackUrl}
              />,
              apiBaseUrl,
              feedbackUrl
            )}
          />
          <Route
            path="/unit/*"
            element={withAuthorization(
              <UnitsRouter
                reservationUnitPreviewUrl={reservationUnitPreviewUrl}
              />,
              apiBaseUrl,
              feedbackUrl,
              UserPermissionChoice.CanManageReservationUnits
            )}
          />
          <Route
            path="/reservations/*"
            element={withAuthorization(
              <ReservationsRouter />,
              apiBaseUrl,
              feedbackUrl
            )}
          />
          <Route
            path="/my-units/*"
            element={withAuthorization(
              <MyUnitsRouter
                apiBaseUrl={apiBaseUrl}
                feedbackUrl={feedbackUrl}
              />,
              apiBaseUrl,
              feedbackUrl
            )}
          />
          <Route
            path="/messaging/notifications/*"
            element={withAuthorization(
              <NotificationsRouter />,
              apiBaseUrl,
              feedbackUrl,
              UserPermissionChoice.CanManageNotifications
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
