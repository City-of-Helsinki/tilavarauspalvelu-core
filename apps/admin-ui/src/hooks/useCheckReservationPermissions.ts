import { gql } from "@apollo/client";
import { useCheckPermission } from "./useCheckPermission";
import { createNodeId, filterNonNullable, getNode } from "common/src/helpers";
import { useReservationPermissionsQuery, UserPermissionChoice } from "@gql/gql-types";

/// @param pk - Primary key of the reservation
export function useCheckReservationPermissions(pk: number) {
  const { data, loading: qLoading } = useReservationPermissionsQuery({
    variables: { id: createNodeId("ReservationNode", pk) },
    skip: !pk,
  });
  const node = getNode(data);
  const units = filterNonNullable([node?.reservationUnit?.unit?.pk]);
  const { hasPermission, isLoading } = useCheckPermission({
    units,
    permission: UserPermissionChoice.CanManageReservations,
  });
  return { hasPermission, loading: qLoading || isLoading };
}

export const GET_RESERVATION_PERMISSION_QUERY = gql`
  query ReservationPermissions($id: ID!) {
    node(id: $id) {
      ... on ReservationNode {
        id
        reservationUnit {
          id
          unit {
            id
            pk
          }
        }
      }
    }
  }
`;
