/*
import React from "react";
import dynamic from "next/dynamic";
import "./i18n";
import { PUBLIC_URL } from "./common/const";
import { applicationsUrl } from "./common/urls";
import ReservationsRouter from "./spa/reservations/router";
import NotificationsRouter from "./spa/notifications/router";
import { UserPermissionChoice } from "@gql/gql-types";
import { UnitsRouter } from "./spa/unit/router";
import DeactivatedAccount from "common/src/components/DeactivatedAccount";

const ApplicationDetails = dynamic(() => import("./spa/applications/[id]/index"));

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

function ClientApp({ reservationUnitPreviewUrl, apiBaseUrl, feedbackUrl }: Props) {
  return (
        <Routes>
          <Route
            path={`${applicationsUrl}/*`}
            element={withAuthorization(<ApplicationRouter />, apiBaseUrl, UserPermissionChoice.CanManageApplications)}
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
  );
}
*/
