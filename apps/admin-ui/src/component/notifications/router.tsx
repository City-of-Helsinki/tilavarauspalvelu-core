import React from "react";
import { Route, Routes } from "react-router-dom";
import Index from "./index";
import Page from "./page";

const MyUnitsRouter = (): JSX.Element => (
  <Routes>
    <Route index element={<Index />} />
    <Route path=":pk" element={<Page />} />
  </Routes>
);

export default MyUnitsRouter;
