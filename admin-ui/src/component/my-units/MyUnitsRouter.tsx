import React from "react";
import { Route, Switch } from "react-router-dom";
import MyUnits from "./MyUnits";
import ReservationUnitCalendarView from "./ReservationUnitCalendarView";

const MyUnitsRouter = (): JSX.Element => (
  <Switch>
    <Route path="/my-units" component={MyUnits} exact />
    <Route
      path="/my-units/:unitId/:reservationUnitId?"
      component={ReservationUnitCalendarView}
    />
  </Switch>
);

export default MyUnitsRouter;
