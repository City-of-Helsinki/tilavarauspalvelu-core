import React from "react";
import { useParams } from "react-router-dom";
import RequestedReservation from "./requested/RequestedReservation";
import RequestedReservations from "./RequestedReservations";
import AllReservations from "./AllReservations";

type Params = {
  id: string;
};

const Index = (): JSX.Element => {
  const { id } = useParams<Params>();

  if (id === "requested") {
    return <RequestedReservations />;
  }
  if (id === "all") {
    return <AllReservations />;
  }
  return <RequestedReservation />;
};
export default Index;
