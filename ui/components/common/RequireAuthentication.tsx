import React from "react";
import dynamic from "next/dynamic";
import { isBrowser } from "../../modules/const";

type Props = {
  children: React.ReactNode;
};

const RequireAuthentication = ({ children }: Props): JSX.Element => {
  if (!isBrowser) {
    return null;
  }

  const OidcSecure = dynamic(() =>
    import("@axa-fr/react-oidc-context").then((mod) => mod.OidcSecure)
  );

  return <OidcSecure>{children}</OidcSecure>;
};

export default RequireAuthentication;
