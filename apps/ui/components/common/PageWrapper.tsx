import React from "react";
import styled from "styled-components";
import { BannerNotificationsList } from "common/src/components";
import { CommonBannerNotificationTargetChoices } from "common/types/gql-types";
import Footer from "./Footer";
import { Navigation } from "./Navigation/Navigation";
import Title from "./Title";
import UnpaidReservationNotification from "../reservations/UnpaidReservationNotification";

interface Props {
  children: React.ReactNode;
  overrideBackgroundColor?: string;
  apiBaseUrl: string;
  profileLink: string;
}

const Main = styled.main<{ $bgColor?: string }>`
  font-size: var(--fontsize-body-m);
  flex: 1 0 auto;
  ${({ $bgColor }) => ($bgColor ? `background: ${$bgColor}` : ``)}
`;

function PageWrapper({
  apiBaseUrl,
  profileLink,
  children,
  overrideBackgroundColor,
}: Props): JSX.Element {
  return (
    <>
      <Title>Tilavarauspalvelu</Title>
      <Navigation apiBaseUrl={apiBaseUrl} profileLink={profileLink} />
      <BannerNotificationsList
        centered
        target={CommonBannerNotificationTargetChoices.User}
      />
      <UnpaidReservationNotification />
      <Main
        $bgColor={overrideBackgroundColor}
        id="main"
        style={{ marginBottom: "-14px" }}
      >
        {children}
      </Main>
      <Footer />
      <div id="modal-root" />
    </>
  );
}

export default PageWrapper;
