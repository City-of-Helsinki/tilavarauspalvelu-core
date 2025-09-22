import React from "react";
import type { ReactNode } from "react";
import { useCheckPermission, useSession } from "@/hooks";
import type { VisibleIfPermissionFieldsFragment, UserPermissionChoice } from "@gql/gql-types";
import { gql } from "@apollo/client";

export function VisibleIfPermission({
  reservation,
  permission,
  children,
  otherwise,
}: {
  reservation: VisibleIfPermissionFieldsFragment;
  permission: UserPermissionChoice;
  children: ReactNode;
  otherwise?: JSX.Element | null;
}): JSX.Element | null {
  const { user } = useSession();
  const isOwner = reservation.user?.pk === user?.pk;
  const { hasPermission } = useCheckPermission({
    units: [reservation.reservationUnit.unit?.pk ?? 0],
    permission,
  });

  if (!isOwner && !hasPermission) {
    return otherwise || null;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment -- return type issues
  return <>{children}</>;
}

export const VISIBLE_IF_PERMISSION_FRAGMENT = gql`
  fragment VisibleIfPermissionFields on ReservationNode {
    id
    user {
      id
      pk
    }
    reservationUnit {
      id
      unit {
        id
        pk
      }
    }
  }
`;
