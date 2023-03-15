import React from "react";
import styled from "styled-components";
import Footer from "./Footer";
import { Navigation } from "./Navigation/Navigation";
import ServiceNotification from "./ServiceNotification";
import Title from "./Title";

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
      <ServiceNotification />
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
