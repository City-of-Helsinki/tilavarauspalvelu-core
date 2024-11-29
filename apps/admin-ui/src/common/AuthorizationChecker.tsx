import React, { Suspense } from "react";
import { useSessionSuspense } from "@/hooks/auth";
import { MainLander } from "@/component/MainLander";
import Error403 from "./Error403";
import { UserPermissionChoice } from "@gql/gql-types";
import {
  hasAnyPermission,
  hasSomePermission,
} from "@/modules/permissionHelper";
import { CenterSpinner } from "common/styles/util";

export function AuthorizationChecker({
  apiUrl,
  children,
  permission,
  feedbackUrl,
}: {
  apiUrl: string;
  children: React.ReactNode;
  feedbackUrl: string;
  permission?: UserPermissionChoice;
}) {
  const { isAuthenticated, user } = useSessionSuspense();
  if (!isAuthenticated) {
    return <MainLander apiBaseUrl={apiUrl} />;
  }

  const hasAccess = permission
    ? hasSomePermission(user, permission)
    : hasAnyPermission(user);

  // Use suspense to avoid flash of unauthorised content
  return (
    <Suspense fallback={<CenterSpinner />}>
      {hasAccess ? (
        children
      ) : (
        <Error403 apiBaseUrl={apiUrl} feedbackUrl={feedbackUrl} />
      )}
    </Suspense>
  );
}

export const withAuthorization = (
  component: JSX.Element,
  apiBaseUrl: string,
  feedbackUrl: string,
  permission?: UserPermissionChoice
) => (
  <AuthorizationChecker
    permission={permission}
    apiUrl={apiBaseUrl}
    feedbackUrl={feedbackUrl}
  >
    {component}
  </AuthorizationChecker>
);
