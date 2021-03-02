import React from "react";
// eslint-disable-next-line import/no-unresolved
import { useReactOidc } from "@axa-fr/react-oidc-context";
import { setApiToken } from "../api";
import Authenticating from "../../component/Authentication/Authenticating";

function UpdateToken(): JSX.Element {
  const { oidcUser } = useReactOidc();
  if (oidcUser) {
    setApiToken(oidcUser.id_token);
  } else {
    setApiToken(null);
  }

  return <Authenticating />;
}

export default UpdateToken;
