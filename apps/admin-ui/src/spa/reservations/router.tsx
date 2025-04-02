import React from "react";
import { Route, Routes, useParams } from "react-router-dom";
import { RequestedPage } from "./requested";
import { ListReservationsPage } from ".";
import { EditPage } from "./[id]/edit";
import { ReservationPage } from "./[id]";
import { SeriesPage } from "./[id]/series";
import {
  useReservationPermissionsQuery,
  UserPermissionChoice,
} from "@gql/gql-types";
import { gql } from "@apollo/client";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { useCheckPermission } from "@/hooks";
import Error403 from "@/common/Error403";
import { CenterSpinner } from "common/styles/util";

// TODO there is no index? (all and requested works like index but not really)
function ReservationsRouter(): JSX.Element {
  return (
    <Routes>
      <Route index element={<ListReservationsPage />} />
      <Route path="requested" element={<RequestedPage />} />
      <Route path="all" element={<ListReservationsPage />} />
      <Route path=":id" element={<ReservationPage />} />
      <Route
        path=":id/edit"
        element={<PermCheckedRoute element={<EditPage />} />}
      />
      <Route
        path=":id/series"
        element={<PermCheckedRoute element={<SeriesPage />} />}
      />
    </Routes>
  );
}

export const GET_RESERVATION_PERMISSION_QUERY = gql`
  query ReservationPermissions($id: ID!) {
    reservation(id: $id) {
      id
      reservationUnits {
        id
        unit {
          id
          pk
        }
      }
    }
  }
`;

function useCheckReservationPermissions(pk?: string) {
  const id = base64encode(`ReservationNode:${pk}`);
  const { data, loading: qLoading } = useReservationPermissionsQuery({
    variables: { id },
    skip: !pk,
  });
  const units = filterNonNullable(
    data?.reservation?.reservationUnits.map((ru) => ru.unit?.pk)
  );
  const { hasPermission, isLoading } = useCheckPermission({
    units,
    permission: UserPermissionChoice.CanManageReservations,
  });
  return { hasPermission, loading: qLoading || isLoading };
}

type PermCheckedRouteProps = {
  element: JSX.Element;
};

/// Custom permission checks that use backend queries for the check
/// requires the query because we don't known the unit the reservation is for
function PermCheckedRoute({ element }: PermCheckedRouteProps) {
  const { id } = useParams();
  const { hasPermission, loading } = useCheckReservationPermissions(id);
  if (loading) {
    return <CenterSpinner />;
  }
  if (!hasPermission) {
    return <Error403 />;
  }
  return element;
}

export default ReservationsRouter;
