import React from "react";
import { Route, Routes } from "react-router-dom";
import MyUnits from "./MyUnits";
import MyUnitView from "./MyUnitView";

const MyUnitsRouter = (): JSX.Element => (
  <Routes>
    <Route path="/my-units" element={<MyUnits />} />
    <Route path="/my-units/:unitId" element={<MyUnitView />} />
  </Routes>
);

export default MyUnitsRouter;
