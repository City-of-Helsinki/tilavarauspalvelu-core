import React from "react";
import { RouteProps } from "react-router-dom";
import { useAuthState } from "../context/AuthStateContext";
import { AuthState } from "../context/authStateReducer";

import Error403 from "./Error403";
import Error5xx from "./Error5xx";
import ErrorNotLoggedIn from "./ErrorNotAuthenticated";

const AuthStateError = (state: AuthState) => {
  switch (state) {
    case "HasPermissions":
      return null;
    case "NoPermissions":
      return <Error403 />;
    case "NotAutenticated":
      return <ErrorNotLoggedIn />;
    case "ApiKeyAvailable":
    case "Unknown":
    case "Authenticated":
      return <span />;
    case "Error":
    default:
      return <Error5xx />;
  }
};

type Props = RouteProps;

const PrivateRoute = ({ children }: Props) => {
  const { authState } = useAuthState();
  const error = AuthStateError(authState.state);

  if (error) return error;

  return <> {children} </>;
};

export { PrivateRoute };
