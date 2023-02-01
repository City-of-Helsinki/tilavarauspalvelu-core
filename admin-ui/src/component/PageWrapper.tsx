import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/react";
import styled from "styled-components";
import ScrollToTop from "../common/ScrollToTop";
import GlobalElements from "./GlobalElements";
import Navigation from "./Navigation";

type Props = {
  children: React.ReactNode | React.ReactElement;
};

const Content = styled.main`
  width: 100%;
  height: 100%;
`;

const FallbackComponent = (err: unknown) => {
  Sentry.captureException(err);
  return <div>500 Something went wrong</div>;
};

export default function PageWrapper({ children }: Props): JSX.Element {
  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <Navigation />
      <Content>
        {children}
        <ScrollToTop />
      </Content>
      <GlobalElements />
    </ErrorBoundary>
  );
}
