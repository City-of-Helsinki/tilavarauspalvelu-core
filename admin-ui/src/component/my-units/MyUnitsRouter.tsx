import React from "react";
import { Route, Switch } from "react-router-dom";
import MyUnits from "./MyUnits";
import MyUnitView from "./MyUnitView";

const MyUnitsRouter = (): JSX.Element => (
  <Switch>
    <Route path="/my-units" component={MyUnits} exact />
    <Route path="/my-units/:unitId" component={MyUnitView} exact />
  </Switch>
);

export default MyUnitsRouter;
