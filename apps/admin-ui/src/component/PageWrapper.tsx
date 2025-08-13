import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/nextjs";
import styled from "styled-components";
import { ErrorGeneric } from "@/component/ErrorGeneric";
import { BannerNotificationsList } from "common/src/components";
import { BannerNotificationTarget } from "@gql/gql-types";
import { ScrollToTop } from "@/component/ScrollToTop";
import { Navigation } from "./Navigation";
import { ToastContainer } from "common/src/components/toast";
import { useModal } from "@/context/ModalContext";
import { mainStyles } from "common/styled";
import { AuthorizationChecker } from "@/component/AuthorizationChecker";

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
