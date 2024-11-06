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

// TODO these are copied from admin-ui
export const Layout = styled.div`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  box-sizing: border-box;

  padding-bottom: var(--spacing-layout-xl);
`;

const Main = styled.main`
  max-width: var(--tilavaraus-page-max-width);
  padding: 0 var(--tilavaraus-page-margin);
  /* TODO move to global styles */
  box-sizing: border-box;

  margin: 0 auto;
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  gap: var(--spacing-2-xl);
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
      <Layout>
        <Main id="main">{children}</Main>
      </Layout>
      <Footer feedbackUrl={feedbackUrl} />
      <div id="modal-root" />
    </>
  );
}

export default PageWrapper;
