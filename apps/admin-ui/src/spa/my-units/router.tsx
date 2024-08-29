import React from "react";
import { Route, Routes } from "react-router-dom";
import { RecurringReservation } from "./recurring/RecurringReservation";
import { MyUnits } from "./index";
import { MyUnitView } from "./[id]/index";
import { RecurringReservationDone } from "./recurring/RecurringReservationDone";
import { withAuthorization } from "@/common/AuthorizationChecker";
import { UserPermissionChoice } from "@gql/gql-types";

function MyUnitsRouter({
  apiBaseUrl,
  feedbackUrl,
}: {
  apiBaseUrl: string;
  feedbackUrl: string;
}): JSX.Element {
  return (
    <Routes>
      <Route index element={<MyUnits />} />
      <Route path=":unitId" element={<MyUnitView />} />
      <Route
        path=":unitId/recurring"
        element={withAuthorization(
          <RecurringReservation />,
          apiBaseUrl,
          feedbackUrl,
          UserPermissionChoice.CanCreateStaffReservations
        )}
      />
      <Route
        path=":unitId/recurring-reservation"
        element={withAuthorization(
          <RecurringReservation />,
          apiBaseUrl,
          feedbackUrl,
          UserPermissionChoice.CanCreateStaffReservations
        )}
      />
      <Route
        path=":unitId/recurring/:pk/completed"
        element={withAuthorization(
          <RecurringReservationDone />,
          apiBaseUrl,
          feedbackUrl,
          UserPermissionChoice.CanCreateStaffReservations
        )}
      />
      <Route
        path=":unitId/recurring-reservation/completed"
        element={withAuthorization(
          <RecurringReservationDone />,
          apiBaseUrl,
          feedbackUrl,
          UserPermissionChoice.CanCreateStaffReservations
        )}
      />
    </Routes>
  );
}

export default MyUnitsRouter;
