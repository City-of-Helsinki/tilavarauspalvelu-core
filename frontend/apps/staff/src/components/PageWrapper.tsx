import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import styled from "styled-components";
import { BannerNotificationsList } from "ui/src/components";
import { ToastContainer } from "ui/src/components/toast";
import { mainStyles } from "ui/src/styled";
import { logError } from "@ui/modules/errors";
import { ErrorGeneric } from "@/components/ErrorGeneric";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useEnvContext } from "@/context/EnvContext";
import { useModal } from "@/context/ModalContext";
import { useSession } from "@/hooks";
import { BannerNotificationTarget } from "@gql/gql-types";
import { Navigation } from "./Navigation";

type Props = {
  children: React.ReactElement;
};

const Content = styled.main`
  ${mainStyles}
`;

const FallbackComponent = (err: unknown) => {
  logError(err);
  return <ErrorGeneric />;
};

export function PageWrapper({ children }: Props): JSX.Element {
  const { modalContent } = useModal();
  const { env } = useEnvContext();
  const { isAuthenticated } = useSession();

  return (
    <ErrorBoundary FallbackComponent={(e) => FallbackComponent(e)}>
      <Navigation apiBaseUrl={env.apiBaseUrl} />
      <Content>
        {isAuthenticated && <BannerNotificationsList target={BannerNotificationTarget.Staff} />}
        {children}
        <ToastContainer />
      </Content>
      <ScrollToTop />
      {modalContent.content}
    </ErrorBoundary>
  );
}
