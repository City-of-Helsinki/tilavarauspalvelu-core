import React from "react";
import Head from "next/head";
import styled from "styled-components";
import { BannerNotificationsList } from "common/src/components";
import { BannerNotificationTarget } from "@gql/gql-types";
import Footer from "./Footer";
import Navigation from "./Navigation";
import { InProgressReservationNotification } from "@/components/reservations/UnpaidReservationNotification";

interface Props {
  children: React.ReactNode;
  overrideBackgroundColor?: string;
  apiBaseUrl: string;
  profileLink: string;
  feedbackUrl: string;
  version: string;
}

const Main = styled.main`
  font-size: var(--fontsize-body-m);
  flex: 1 0 auto;
  margin-bottom: -14px;
`;

function PageWrapper({
  apiBaseUrl,
  profileLink,
  feedbackUrl,
  children,
  version,
}: Props): JSX.Element {
  return (
    <>
      <Head>
        <title>Tilavarauspalvelu</title>
        <meta name="version" content={version} />
      </Head>
      <Navigation apiBaseUrl={apiBaseUrl} profileLink={profileLink} />
      <BannerNotificationsList
        centered
        target={BannerNotificationTarget.User}
      />
      <InProgressReservationNotification />
      <Main id="main">{children}</Main>
      <Footer feedbackUrl={feedbackUrl} />
      <div id="modal-root" />
    </>
  );
}

export default PageWrapper;
