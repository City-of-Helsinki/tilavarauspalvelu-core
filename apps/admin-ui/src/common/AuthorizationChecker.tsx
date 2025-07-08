import React from "react";
import { useSession } from "@/hooks/auth";
import { MainLander } from "@/component/MainLander";
import Error403 from "./Error403";
import { UserPermissionChoice } from "@gql/gql-types";
import { hasAnyPermission, hasSomePermission } from "@/modules/permissionHelper";

export function AuthorizationChecker({
  apiUrl,
  children,
  permission,
}: {
  apiUrl: string;
  children: React.ReactElement | React.ReactElement[];
  permission?: UserPermissionChoice;
}): React.ReactElement {
  const { user: currentUser, isAuthenticated } = useSession();
  if (!isAuthenticated) {
    return <MainLander apiBaseUrl={apiUrl} />;
  }

  const hasAccess = permission ? hasSomePermission(currentUser, permission) : hasAnyPermission(currentUser);

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return hasAccess ? <>{children}</> : <Error403 />;
}
