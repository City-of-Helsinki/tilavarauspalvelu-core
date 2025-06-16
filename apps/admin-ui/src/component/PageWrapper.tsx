import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/nextjs";
import styled from "styled-components";
import ClientOnly from "common/src/ClientOnly";
import ErrorGeneric from "@/common/ErrorGeneric";
import { BannerNotificationsList } from "common/src/components";
import { BannerNotificationTarget } from "@gql/gql-types";
import ScrollToTop from "../common/ScrollToTop";
import Navigation from "./Navigation";
import { MainLander } from "./MainLander";
import { ToastContainer } from "common/src/common/toast";
import { useModal } from "@/context/ModalContext";
import { useSession } from "@/hooks/auth";
import { hasAnyPermission } from "@/modules/permissionHelper";
import { CenterSpinner, mainStyles } from "common/styled";

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

// NOTE client only because Navigation requires react-router-dom
export default function PageWrapper({ apiBaseUrl, children }: Props): JSX.Element {
  const { user } = useSession();
  const hasAccess = hasAnyPermission(user);
  const { modalContent } = useModal();

  return (
    <ErrorBoundary FallbackComponent={(e) => FallbackComponent(e)}>
      <ClientOnly>
        <Navigation apiBaseUrl={apiBaseUrl} />
        <Suspense fallback={<CenterSpinner />}>
          <Content>
            {hasAccess && <BannerNotificationsList target={BannerNotificationTarget.Staff} />}
            {user ? children : <MainLander apiBaseUrl={apiBaseUrl} />}
            <ToastContainer />
          </Content>
        </Suspense>
        <ScrollToTop />
        {modalContent.content}
      </ClientOnly>
    </ErrorBoundary>
  );
}
