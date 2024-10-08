import { ApplicationQuery } from "@/gql/gql-types";
import React from "react";

type ApplicationT = NonNullable<ApplicationQuery["application"]>;
type Props = {
  application: ApplicationT;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ApprovedReservations(application: Props) {
  return <div>ReservationsList: TODO</div>;
}
