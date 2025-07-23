import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/nextjs";
import styled from "styled-components";
import { ErrorGeneric } from "@/component/ErrorGeneric";
import { BannerNotificationsList } from "common/src/components";
import { BannerNotificationTarget } from "@gql/gql-types";
import { ScrollToTop } from "@/component/ScrollToTop";
import { Navigation } from "./Navigation";
import { MainLander } from "./MainLander";
import { ToastContainer } from "common/src/components/toast";
import { useModal } from "@/context/ModalContext";
import { useSession } from "@/hooks/auth";
import { hasAnyPermission } from "@/modules/permissionHelper";
import { mainStyles } from "common/styled";

type Props = {
  apiBaseUrl: string;
  children: React.ReactNode;
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
  const { user } = useSession();
  const hasAccess = hasAnyPermission(user);
  const { modalContent } = useModal();

  return (
    <ErrorBoundary FallbackComponent={(e) => FallbackComponent(e)}>
      <Navigation apiBaseUrl={apiBaseUrl} />
      <Content>
        {hasAccess && <BannerNotificationsList target={BannerNotificationTarget.Staff} />}
        {user != null ? children : <MainLander apiBaseUrl={apiBaseUrl} />}
        <ToastContainer />
      </Content>
      <ScrollToTop />
      {modalContent.content}
    </ErrorBoundary>
  );
}
