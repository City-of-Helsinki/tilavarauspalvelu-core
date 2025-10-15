import React from "react";
import Head from "next/head";
import styled from "styled-components";
import { BannerNotificationsList } from "common/src/components";
import { BannerNotificationTarget } from "@gql/gql-types";
import Footer from "./Footer";
import Navigation from "./Navigation";
import { InProgressReservationNotification } from "@/components/InProgressReservationNotification";
import { mainStyles } from "common/src/styled";

interface PageProps {
  children: React.ReactNode;
  overrideBackgroundColor?: string;
  apiBaseUrl: string;
  profileLink: string;
  feedbackUrl: string;
  version: string;
}

const Main = styled.main`
  ${mainStyles}
`;

function PageWrapper({ apiBaseUrl, profileLink, feedbackUrl, children, version }: PageProps): JSX.Element {
  return (
    <>
      <Head>
        <title>Tilavarauspalvelu</title>
        <meta name="version" content={version} />
      </Head>
      <Navigation apiBaseUrl={apiBaseUrl} profileLink={profileLink} />
      <BannerNotificationsList target={BannerNotificationTarget.User} />
      <InProgressReservationNotification />
      <Main id="main">{children}</Main>
      <Footer feedbackUrl={feedbackUrl} />
      <div id="modal-root" />
    </>
  );
}

export default PageWrapper;
