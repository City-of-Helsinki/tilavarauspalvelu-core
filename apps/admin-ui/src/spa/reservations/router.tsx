import React from "react";
import { Route, Routes } from "react-router-dom";
import { RequestedPage } from "./requested";
import { ListReservationsPage } from ".";
import { EditPage } from "./[id]/edit";
import { ReservationPage } from "./[id]";

// TODO there is no index? (all and requested works like index but not really)
const ReservationsRouter = (): JSX.Element => (
  <Routes>
    <Route index element={<ListReservationsPage />} />
    <Route path="requested" element={<RequestedPage />} />
    <Route path="all" element={<ListReservationsPage />} />
    <Route path=":id" element={<ReservationPage />} />
    <Route path=":id/edit" element={<EditPage />} />
  </Routes>
);

export default ReservationsRouter;
