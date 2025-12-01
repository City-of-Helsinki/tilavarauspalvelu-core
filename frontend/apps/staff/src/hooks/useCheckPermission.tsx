import { gql } from "@apollo/client";
import type { UserPermissionChoice } from "@gql/gql-types";
import { useCheckPermissionsQuery } from "@gql/gql-types";

/**
 * Hook that checks if the user has a specific permission for given units
 * @param units - Array of unit IDs to check permissions for
 * @param permission - Permission type to check
 * @param requireAll - If true, requires permission on all units; if false, requires permission on at least one unit
 * @returns Object containing hasPermission flag, isLoading state, and error
 */
export function useCheckPermission({
  units,
  permission,
  requireAll = false,
}: {
  units: number[];
  permission: UserPermissionChoice;
  requireAll?: boolean;
}) {
  const {
    data: permissionsData,
    loading,
    error,
  } = useCheckPermissionsQuery({
    variables: {
      permission,
      units,
      requireAll,
    },
  });

  const perms = permissionsData?.checkPermissions;

  return {
    hasPermission: perms?.hasPermission,
    isLoading: loading,
    error,
  };
}

export const CHECK_PERMISSIONS_QUERY = gql`
  query CheckPermissions($permission: UserPermissionChoice!, $units: [Int!], $requireAll: Boolean = false) {
    checkPermissions(permission: $permission, units: $units, requireAll: $requireAll) {
      hasPermission
    }
  }
`;
