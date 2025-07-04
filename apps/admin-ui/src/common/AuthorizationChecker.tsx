import React, { Suspense } from "react";
import { useSessionSuspense } from "@/hooks/auth";
import { MainLander } from "@/component/MainLander";
import Error403 from "./Error403";
import { UserPermissionChoice } from "@gql/gql-types";
import { hasAnyPermission, hasSomePermission } from "@/modules/permissionHelper";
import { CenterSpinner } from "common/styled";

export function AuthorizationChecker({
  apiUrl,
  children,
  permission,
}: {
  apiUrl: string;
  children: React.ReactNode;
  permission?: UserPermissionChoice;
}) {
  const { isAuthenticated, user } = useSessionSuspense();
  if (!isAuthenticated) {
    return <MainLander apiBaseUrl={apiUrl} />;
  }

  const hasAccess = permission ? hasSomePermission(user, permission) : hasAnyPermission(user);

  // Use suspense to avoid flash of unauthorised content
  return <Suspense fallback={<CenterSpinner />}>{hasAccess ? children : <Error403 />}</Suspense>;
}

export const withAuthorization = (component: JSX.Element, apiBaseUrl: string, permission?: UserPermissionChoice) => (
  <AuthorizationChecker permission={permission} apiUrl={apiBaseUrl}>
    {component}
  </AuthorizationChecker>
);
