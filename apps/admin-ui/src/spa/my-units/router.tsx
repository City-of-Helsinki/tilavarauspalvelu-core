import React from "react";
import { Route, Routes } from "react-router-dom";
import { ReservationSeries } from "./recurring/ReservationSeries";
import { MyUnits } from "./index";
import { MyUnitView } from "./[id]/index";
import { ReservationSeriesDone } from "./recurring/ReservationSeriesDone";
import { withAuthorization } from "@/common/AuthorizationChecker";
import { UserPermissionChoice } from "@gql/gql-types";

function MyUnitsRouter({ apiBaseUrl }: { apiBaseUrl: string }): JSX.Element {
  return (
    <Routes>
      <Route index element={<MyUnits />} />
      <Route path=":unitId" element={<MyUnitView />} />
      <Route
        path=":unitId/recurring"
        element={withAuthorization(<ReservationSeries />, apiBaseUrl, UserPermissionChoice.CanCreateStaffReservations)}
      />
      <Route
        path=":unitId/recurring-reservation"
        element={withAuthorization(<ReservationSeries />, apiBaseUrl, UserPermissionChoice.CanCreateStaffReservations)}
      />
      <Route
        path=":unitId/recurring/:pk/completed"
        element={withAuthorization(
          <ReservationSeriesDone />,
          apiBaseUrl,
          UserPermissionChoice.CanCreateStaffReservations
        )}
      />
      <Route
        path=":unitId/recurring-reservation/completed"
        element={withAuthorization(
          <ReservationSeriesDone />,
          apiBaseUrl,
          UserPermissionChoice.CanCreateStaffReservations
        )}
      />
    </Routes>
  );
}

export default MyUnitsRouter;
