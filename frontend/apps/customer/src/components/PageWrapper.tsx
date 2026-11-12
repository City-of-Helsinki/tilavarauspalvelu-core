import React from "react";
import styled from "styled-components";
import { BannerNotificationsList } from "ui/src/components";
import { mainStyles } from "ui/src/styled";
import { BannerNotificationTarget } from "@gql/gql-types";
import { InProgressReservationNotification } from "@/components/InProgressReservationNotification";
import { Footer } from "./Footer";
import { Navigation } from "./Navigation";

interface PageProps {
  children: React.ReactNode;
  overrideBackgroundColor?: string;
  apiBaseUrl: string;
  profileLink: string;
  feedbackUrl: string;
}

const Main = styled.main`
  ${mainStyles}
`;

export function PageWrapper({ apiBaseUrl, profileLink, feedbackUrl, children }: PageProps): React.ReactElement {
  return (
    <>
      <Navigation apiBaseUrl={apiBaseUrl} profileLink={profileLink} />
      <BannerNotificationsList target={BannerNotificationTarget.User} />
      <InProgressReservationNotification />
      <Main id="main">{children}</Main>
      <Footer feedbackUrl={feedbackUrl} />
      <div id="modal-root" />
    </>
  );
}
