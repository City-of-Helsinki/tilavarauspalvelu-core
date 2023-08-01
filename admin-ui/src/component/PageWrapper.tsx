import React, { Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/react";
import styled from "styled-components";
import Error5xx from "app/common/Error5xx";
import ScrollToTop from "../common/ScrollToTop";
import GlobalElements from "./GlobalElements";
import Navigation from "./Navigation";
import MainMenu from "./MainMenu";
import Loader from "./Loader";

type Props = {
  children: React.ReactNode | React.ReactElement;
};

const Content = styled.main`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
`;

const FallbackComponent = (err: unknown) => {
  Sentry.captureException(err);
  return <Error5xx />;
};

// Pure client side component
export default function PageWrapper({ children }: Props): JSX.Element | null {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return null;
  }

  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <Navigation />
      <Wrapper>
        <MainMenu placement="default" />
        <Suspense fallback={<Loader />}>
          <Content>{children}</Content>
        </Suspense>
        <ScrollToTop />
      </Wrapper>
      <GlobalElements />
    </ErrorBoundary>
  );
}
