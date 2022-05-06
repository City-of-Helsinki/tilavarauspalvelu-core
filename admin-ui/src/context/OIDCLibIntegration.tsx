import { useReactOidc } from "@axa-fr/react-oidc-context";
import { User } from "oidc-client";
import { useEffect } from "react";

const OIDCLibIntegration = ({
  setUser,
}: {
  // eslint-disable-next-line @typescript-eslint/ban-types
  setUser: (user: User, login: Function, logout: Function) => void;
}): null => {
  const { oidcUser, login, logout } = useReactOidc();

  useEffect(() => {
    setUser(oidcUser, login, logout);
  }, [oidcUser, login, logout, setUser]);
  return null;
};

export default OIDCLibIntegration;
