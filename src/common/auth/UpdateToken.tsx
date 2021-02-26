import { useReactOidc } from '@axa-fr/react-oidc-context';
import { LoadingSpinner } from 'hds-react';
import React from 'react';
import PageWrapper from '../../component/PageWrapper';
import { setApiToken } from '../api';

const UpdateToken = (): JSX.Element => {
  const { oidcUser } = useReactOidc();
  if (oidcUser) {
    setApiToken(oidcUser.id_token);
  } else {
    setApiToken(null);
  }
  return (
    <PageWrapper>
      <LoadingSpinner />
    </PageWrapper>
  );
};

export default UpdateToken;
