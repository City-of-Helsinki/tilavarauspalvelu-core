import React, { Suspense } from "react";
import { useSession } from "app/hooks/auth";
import { usePermissionSuspended } from "app/hooks/usePermission";
import { MainLander } from "app/component/MainLander";
import Loader from "app/component/Loader";
import Error403 from "./Error403";
import { UserPermissionChoice } from "@gql/gql-types";

const AuthorisationChecker = ({
  apiUrl,
  children,
  permission,
  feedbackUrl,
}: {
  apiUrl: string;
  children: React.ReactNode;
  feedbackUrl: string;
  permission?: UserPermissionChoice;
}) => {
  const { hasAnyPermission, hasSomePermission } = usePermissionSuspended();

  const { isAuthenticated } = useSession();
  if (!isAuthenticated) {
    return <MainLander apiBaseUrl={apiUrl} />;
  }

  const hasAccess = permission
    ? hasSomePermission(permission)
    : hasAnyPermission();

  // Use suspense to avoid flash of unauthorised content
  return (
    <Suspense fallback={<Loader />}>
      {hasAccess ? (
        children
      ) : (
        <Error403 apiBaseUrl={apiUrl} feedbackUrl={feedbackUrl} />
      )}
    </Suspense>
  );
};

export default AuthorisationChecker;
