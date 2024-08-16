import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/nextjs";
import styled from "styled-components";
import ClientOnly from "common/src/ClientOnly";
import Error5xx from "app/common/Error5xx";
import usePermission from "app/hooks/usePermission";
import { BannerNotificationsList } from "common/src/components";
import { BannerNotificationTarget } from "@gql/gql-types";
import ScrollToTop from "../common/ScrollToTop";
import GlobalElements from "./GlobalElements";
import Navigation from "./Navigation";
import Loader from "./Loader";
import { MainLander } from "./MainLander";

type Props = {
  apiBaseUrl: string;
  feedbackUrl: string;
  children: React.ReactNode;
};

const Content = styled.main`
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
`;

const FallbackComponent = (err: unknown, feedbackUrl: string) => {
  // eslint-disable-next-line no-console
  console.error(err);
  Sentry.captureException(err);
  return <Error5xx feedbackUrl={feedbackUrl} />;
};

// NOTE client only because Navigation requires react-router-dom
export default function PageWrapper({
  apiBaseUrl,
  feedbackUrl,
  children,
}: Props): JSX.Element {
  const { hasAnyPermission, user } = usePermission();
  const hasAccess = user && hasAnyPermission();
  return (
    <ErrorBoundary FallbackComponent={(e) => FallbackComponent(e, feedbackUrl)}>
      <ClientOnly>
        <Navigation apiBaseUrl={apiBaseUrl} />
        <Wrapper>
          <Suspense fallback={<Loader />}>
            <Content>
              {hasAccess && (
                <BannerNotificationsList
                  target={BannerNotificationTarget.Staff}
                />
              )}
              {user ? children : <MainLander apiBaseUrl={apiBaseUrl} />}
            </Content>
          </Suspense>
          <ScrollToTop />
        </Wrapper>
        <GlobalElements />
      </ClientOnly>
    </ErrorBoundary>
  );
}
