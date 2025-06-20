import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import dynamic from "next/dynamic";
import ApplicationRound from "./spa/application-rounds/[id]";
import PageWrapper from "./component/PageWrapper";
import "./i18n";
import { PUBLIC_URL } from "./common/const";
import { GlobalContext } from "./context/GlobalContexts";
import { applicationsUrl } from "./common/urls";
import { withAuthorization } from "@/common/AuthorizationChecker";
import MyUnitsRouter from "./spa/my-units/router";
import ReservationsRouter from "./spa/reservations/router";
import NotificationsRouter from "./spa/notifications/router";
import Error404 from "./common/Error404";
import { UserPermissionChoice } from "@gql/gql-types";
import { UnitsRouter } from "./spa/unit/router";
import DeactivatedAccount from "common/src/components/DeactivatedAccount";

const Units = dynamic(() => import("./spa/unit"));

const ApplicationDetails = dynamic(() => import("./spa/applications/[id]/index"));

const ReservationUnits = dynamic(() => import("./spa/reservation-units/index"));

const HomePage = dynamic(() => import("./spa/HomePage"));

const AllApplicationRounds = dynamic(() => import(`./spa/application-rounds/index`));
const Criteria = dynamic(() => import(`./spa/application-rounds/[id]/criteria`));
const ApplicationRoundAllocation = dynamic(() => import(`./spa/application-rounds/[id]/allocation`));

type Props = {
  reservationUnitPreviewUrl: string;
  apiBaseUrl: string;
  feedbackUrl: string;
};

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
    <Route path=":applicationRoundPk/allocation" element={<ApplicationRoundAllocation />} />
    <Route path=":applicationRoundId" element={<ApplicationRound />} />
  </Routes>
);

function ClientApp({ reservationUnitPreviewUrl, apiBaseUrl, feedbackUrl }: Props) {
  return (
    <BrowserRouter basename={PUBLIC_URL}>
      <PageWrapper apiBaseUrl={apiBaseUrl}>
        <Routes>
          <Route path="*" element={<Error404 />} />
          <Route path="/" element={withAuthorization(<HomePage />, apiBaseUrl)} />
          <Route
            path={`${applicationsUrl}/*`}
            element={withAuthorization(<ApplicationRouter />, apiBaseUrl, UserPermissionChoice.CanManageApplications)}
          />
          <Route
            path="/application-rounds/*"
            element={withAuthorization(
              <ApplicationRoundsRouter />,
              apiBaseUrl,
              UserPermissionChoice.CanManageApplications
            )}
          />
          <Route
            path="/reservation-units"
            element={withAuthorization(
              <ReservationUnits />,
              apiBaseUrl,
              UserPermissionChoice.CanManageReservationUnits
            )}
          />
          <Route
            path="units"
            element={withAuthorization(<Units />, apiBaseUrl, UserPermissionChoice.CanManageReservationUnits)}
          />
          <Route
            path="/unit/*"
            element={withAuthorization(
              <UnitsRouter reservationUnitPreviewUrl={reservationUnitPreviewUrl} />,
              apiBaseUrl,
              UserPermissionChoice.CanManageReservationUnits
            )}
          />
          <Route path="/reservations/*" element={withAuthorization(<ReservationsRouter />, apiBaseUrl)} />
          <Route
            path="/my-units/*"
            element={withAuthorization(<MyUnitsRouter apiBaseUrl={apiBaseUrl} />, apiBaseUrl)}
          />
          <Route
            path="/messaging/notifications/*"
            element={withAuthorization(
              <NotificationsRouter />,
              apiBaseUrl,
              UserPermissionChoice.CanManageNotifications
            )}
          />
          <Route
            path="/deactivated-account"
            element={
              <DeactivatedAccount feedbackUrl={feedbackUrl} imgSrc={`${PUBLIC_URL}/images/deactivated-account.png`} />
            }
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
