import { Notification as HDSNotification } from 'hds-react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { BrowserRouter } from 'react-router-dom';
import PageWrapper from '../../component/PageWrapper';
import Container from '../../component/Container';

const Notification = styled(HDSNotification)`
  margin-top: 2em;
`;

const SessionLost = (): JSX.Element => {
  const { t } = useTranslation();

  useEffect(() => {
    sessionStorage.clear();
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.indexOf('oidc') !== -1) {
        localStorage.removeItem(key);
      }
    }
  });

  return (
    <BrowserRouter forceRefresh>
      <PageWrapper>
        <Container>
          <Notification size="small" type="info">
            {t('auth.lostSession.heading')}
          </Notification>
        </Container>
      </PageWrapper>
    </BrowserRouter>
  );
};

export default SessionLost;
