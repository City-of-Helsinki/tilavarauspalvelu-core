import React from "react";
import { Route, Routes } from "react-router-dom";
import MyUnitRecurringReservation from "./MyUnitRecurringReservation/MyUnitRecurringReservation";
import MyUnits from "./MyUnits";
import MyUnitView from "./MyUnitView";
import RecurringReservationDone from "./MyUnitRecurringReservation/RecurringReservationDone";

const MyUnitsRouter = (): JSX.Element => (
  <Routes>
    <Route index element={<MyUnits />} />
    <Route path=":unitId" element={<MyUnitView />} />
    <Route
      path=":unitId/recurring-reservation"
      element={<MyUnitRecurringReservation />}
    />
    <Route
      path=":unitId/recurring-reservation/completed"
      element={<RecurringReservationDone />}
    />
  </Routes>
);

export default MyUnitsRouter;
