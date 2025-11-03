import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/nextjs";
import styled from "styled-components";
import { BannerNotificationsList } from "ui/src/components";
import { ToastContainer } from "ui/src/components/toast";
import { mainStyles } from "ui/src/styled";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { ErrorGeneric } from "@/components/ErrorGeneric";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useModal } from "@/context/ModalContext";
import { BannerNotificationTarget } from "@gql/gql-types";
import { Navigation } from "./Navigation";

type Props = {
  apiBaseUrl: string;
  children: React.ReactElement;
};

const Content = styled.main`
  ${mainStyles}
`;

const FallbackComponent = (err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  Sentry.captureException(err);
  return <ErrorGeneric />;
};

export default function PageWrapper({ apiBaseUrl, children }: Props): JSX.Element {
  const { modalContent } = useModal();

  return (
    <ErrorBoundary FallbackComponent={(e) => FallbackComponent(e)}>
      <Navigation apiBaseUrl={apiBaseUrl} />
      <Content>
        <AuthorizationChecker apiUrl={apiBaseUrl}>
          <BannerNotificationsList target={BannerNotificationTarget.Staff} />
          {children}
        </AuthorizationChecker>
        <ToastContainer />
      </Content>
      <ScrollToTop />
      {modalContent.content}
    </ErrorBoundary>
  );
}
