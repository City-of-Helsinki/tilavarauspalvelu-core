import React from "react";
import { Route, Routes } from "react-router-dom";
import { RecurringReservation } from "./recurring/RecurringReservation";
import { MyUnits } from "./MyUnits";
import { MyUnitView } from "./MyUnitView";
import { RecurringReservationDone } from "./recurring/RecurringReservationDone";

function MyUnitsRouter(): JSX.Element {
  return (
    <Routes>
      <Route index element={<MyUnits />} />
      <Route path=":unitId" element={<MyUnitView />} />
      <Route
        path=":unitId/recurring-reservation"
        element={<RecurringReservation />}
      />
      <Route
        path=":unitId/recurring-reservation/completed"
        element={<RecurringReservationDone />}
      />
    </Routes>
  );
}

export default MyUnitsRouter;
