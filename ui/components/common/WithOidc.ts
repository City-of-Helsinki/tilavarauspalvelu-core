import { useOidc, useOidcUser } from "@axa-fr/react-oidc-context";
// eslint-disable-next-line import/no-unresolved
import { Profile } from "oidc-client";

export type RenderPropsType = { profile: Profile; logout: () => void };
type Props = { render: (props: RenderPropsType) => JSX.Element };

const WithOidc = ({ render }: Props): JSX.Element => {
  const { logout } = useOidc();
  const { oidcUser } = useOidcUser();

  let profile = null;
  if (oidcUser) {
    profile = { ...oidcUser };
  }
  return render({ profile, logout } as RenderPropsType);
};

export default WithOidc;
