import { Notification } from 'hds-react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import PageWrapper from '../../component/PageWrapper';

const LoggingIn = (): JSX.Element => {
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
    <BrowserRouter>
      <PageWrapper>
        <Notification
          size="large"
          type="error"
          label={t('auth.lostSession.heading')}>
          {t('auth.lostSession.text')}
        </Notification>
      </PageWrapper>
    </BrowserRouter>
  );
};

export default LoggingIn;
