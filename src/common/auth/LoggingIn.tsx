import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CenterSpinner } from '../../component/common';
import PageWrapper from '../../component/PageWrapper';

const LoggingIn = (): JSX.Element => {
  return (
    <BrowserRouter>
      <PageWrapper>
        <CenterSpinner />
      </PageWrapper>
    </BrowserRouter>
  );
};

export default LoggingIn;
