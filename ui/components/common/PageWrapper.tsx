import React from "react";
import styled from "styled-components";
import { NotificationList } from "common/src/components";
import Footer from "./Footer";
import { Navigation } from "./Navigation/Navigation";
import Title from "./Title";
import UnpaidReservationNotification from "../reservations/UnpaidReservationNotification";

interface Props {
  children: React.ReactNode;
  overrideBackgroundColor?: string;
}

const Main = styled.main<{ $bgColor?: string }>`
  font-size: var(--fontsize-body-m);
  flex: 1 0 auto;
  ${({ $bgColor }) => ($bgColor ? `background: ${$bgColor}` : ``)}
`;

const PageWrapper = (props: Props): JSX.Element => {
  return (
    <>
      <Title>Tilavarauspalvelu</Title>
      <Navigation />
      <NotificationList />
      <UnpaidReservationNotification />
      <Main
        $bgColor={props.overrideBackgroundColor}
        id="main"
        style={{ marginBottom: "-14px" }}
      >
        {props.children}
      </Main>
      <Footer />
      <div id="modal-root" />
    </>
  );
};

export default PageWrapper;
