import React from "react";
import { useAuthState } from "../context/AuthStateContext";

import Error403 from "./Error403";
import Error5xx from "./Error5xx";
import ErrorNotLoggedIn from "./ErrorNotAuthenticated";

type Props = {
  children: React.ReactChild[] | React.ReactChild;
};

const PrivateRoutes = ({ children }: Props): JSX.Element => {
  const { authState } = useAuthState();

  switch (authState.state) {
    case "HasPermissions":
      return <>{children}</>;
    case "Error":
      return <Error5xx />;
    case "NoPermissions":
      return <Error403 />;
    case "NotAutenticated":
      return <ErrorNotLoggedIn />;
    case "ApiKeyAvailable":
    case "Unknown":
    case "Authenticated":
      return <span />;
    default:
      throw new Error(`Illegal auth state :'${authState.state}'`);
  }
};

export default PrivateRoutes;
