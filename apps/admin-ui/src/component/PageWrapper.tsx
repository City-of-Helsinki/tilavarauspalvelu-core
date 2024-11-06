import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/nextjs";
import styled from "styled-components";
import ClientOnly from "common/src/ClientOnly";
import Error5xx from "@/common/Error5xx";
import { BannerNotificationsList } from "common/src/components";
import { BannerNotificationTarget } from "@gql/gql-types";
import ScrollToTop from "../common/ScrollToTop";
import Navigation from "./Navigation";
import Loader from "./Loader";
import { MainLander } from "./MainLander";
import { ToastContainer } from "common/src/common/toast";
import { useModal } from "@/context/ModalContext";
import Modal from "@/component/Modal";
import { useSession } from "@/hooks/auth";
import { hasAnyPermission } from "@/modules/permissionHelper";
import { mainStyles } from "common/styles/layout";

type Props = {
  apiBaseUrl: string;
  feedbackUrl: string;
  children: React.ReactNode;
};

const Content = styled.main`
  ${mainStyles}
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
  const { user } = useSession();
  const hasAccess = hasAnyPermission(user);
  const { modalContent } = useModal();
  const modal = modalContent.isHds ? (
    modalContent.content
  ) : (
    <Modal>{modalContent.content}</Modal>
  );
  return (
    <ErrorBoundary FallbackComponent={(e) => FallbackComponent(e, feedbackUrl)}>
      <ClientOnly>
        <Navigation apiBaseUrl={apiBaseUrl} />
        <Suspense fallback={<Loader />}>
          <Content>
            {hasAccess && (
              <BannerNotificationsList
                target={BannerNotificationTarget.Staff}
              />
            )}
            {user ? children : <MainLander apiBaseUrl={apiBaseUrl} />}
            <ToastContainer />
          </Content>
        </Suspense>
        <ScrollToTop />
        {modalContent.content && modal}
      </ClientOnly>
    </ErrorBoundary>
  );
}
