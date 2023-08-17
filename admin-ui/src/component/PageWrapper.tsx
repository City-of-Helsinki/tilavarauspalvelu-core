import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/react";
import styled from "styled-components";
import { useSession } from "next-auth/react";

import Error5xx from "app/common/Error5xx";
import ScrollToTop from "../common/ScrollToTop";
import GlobalElements from "./GlobalElements";
import Navigation from "./Navigation";
import MainMenu from "./MainMenu";
import Loader from "./Loader";
import ClientOnly from "./ClientOnly";
import MainLander from "./MainLander";

type Props = {
  children: React.ReactNode;
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

// NOTE client only because Navigation requires react-router-dom
export default function PageWrapper({ children }: Props): JSX.Element {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <ClientOnly>
        <Navigation />
        <Wrapper>
          {isLoggedIn && <MainMenu placement="default" />}
          <Suspense fallback={<Loader />}>
            <Content>{isLoggedIn ? children : <MainLander />}</Content>
          </Suspense>
          <ScrollToTop />
        </Wrapper>
        <GlobalElements />
      </ClientOnly>
    </ErrorBoundary>
  );
}
