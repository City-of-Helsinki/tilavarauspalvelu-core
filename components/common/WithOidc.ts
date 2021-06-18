import { useReactOidc } from '@axa-fr/react-oidc-context';
import { Profile } from 'oidc-client';

export type RenderPropsType = { profile: Profile; logout: () => void };
type Props = { render: (props: RenderPropsType) => JSX.Element };

const WithOidc = ({ render }: Props): JSX.Element => {
  const { oidcUser, logout } = useReactOidc();
  let profile = null;
  if (oidcUser) {
    profile = oidcUser.profile;
  }
  return render({ profile, logout } as RenderPropsType);
};

export default WithOidc;
