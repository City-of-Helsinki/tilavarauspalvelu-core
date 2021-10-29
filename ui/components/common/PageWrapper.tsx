import React from "react";
import styled from "styled-components";
import Navigation from "./Navigation";
import Footer from "./Footer";
import ServiceNotification from "./ServiceNotification";
import Title from "./Title";

interface Props {
  children: React.ReactNode;
}

const Main = styled.main`
  font-size: var(--fontsize-body-m);
  flex: 1 0 auto;
`;

const PageWrapper = (props: Props): JSX.Element => {
  return (
    <>
      <Title>Tilavarauspalvelu</Title>
      <Navigation />
      <ServiceNotification />
      <Main id="main" style={{ marginBottom: "-14px" }}>
        {props.children}
      </Main>
      <Footer />
      <div id="modal-root" />
    </>
  );
};

export default PageWrapper;
