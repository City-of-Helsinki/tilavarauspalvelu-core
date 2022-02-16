import { OidcSecure } from "@axa-fr/react-oidc-context";
import React from "react";
import { assertApiAccessTokenIsAvailable } from "./auth/util";

type Props = {
  children: React.ReactChild[];
};

const PrivateRoutes = ({ children }: Props): JSX.Element => {
  assertApiAccessTokenIsAvailable();
  return <OidcSecure>{children}</OidcSecure>;
};

export default PrivateRoutes;
