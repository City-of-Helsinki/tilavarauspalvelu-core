import { LoadingSpinner } from 'hds-react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import PageWrapper from '../../component/PageWrapper';

const LoggingIn = (): JSX.Element => {
  return (
    <BrowserRouter>
      <PageWrapper>
        <LoadingSpinner />
      </PageWrapper>
    </BrowserRouter>
  );
};

export default LoggingIn;
