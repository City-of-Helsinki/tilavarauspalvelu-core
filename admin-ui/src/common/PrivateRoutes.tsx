import { OidcSecure } from "@axa-fr/react-oidc-context";
import React from "react";

import { useData } from "../context/DataContext";
import Error403 from "./Error403";

type Props = {
  children: React.ReactChild[] | React.ReactChild;
};

const PrivateRoutes = ({ children }: Props): JSX.Element => {
  const { hasAnyPermissions } = useData();

  if (hasAnyPermissions()) {
    return <OidcSecure>{children}</OidcSecure>;
  }

  return <Error403 />;
};

export default PrivateRoutes;
