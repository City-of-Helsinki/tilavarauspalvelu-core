import React, { useEffect, useState } from "react";
import { OidcSecure } from "@axa-fr/react-oidc-context";
import { Route } from "react-router-dom";
import { assertApiAccessTokenIsAvailable } from "./auth/util";

type Props = {
  path: string;
  component: React.FunctionComponent;
  exact?: boolean;
};

const ApiTokenAvailable = ({
  children,
}: {
  children: JSX.Element;
}): JSX.Element | null => {
  const [apiTokeIsAvailable, setApiTokenIsAvailable] = useState(false);

  useEffect(() => {
    assertApiAccessTokenIsAvailable().then(() => {
      setApiTokenIsAvailable(true);
    });
  }, [apiTokeIsAvailable, children]);

  if (apiTokeIsAvailable) {
    return children;
  }

  return null;
};

const PrivateRoute = ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  component: Component,
  ...rest
}: Props): JSX.Element => {
  return (
    <Route
      {...rest}
      component={() => (
        <OidcSecure>
          <ApiTokenAvailable>
            <Component />
          </ApiTokenAvailable>
        </OidcSecure>
      )}
    />
  );
};

export default PrivateRoute;
