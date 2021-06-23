import React from "react";
import styled from "styled-components";
import Head from "next/head";
import Navigation from "./Navigation";
import Footer from "./Footer";
import ServiceNotification from "./ServiceNotification";
import Title from "./Title";
import { apiBaseUrl, authEnabled } from "../../modules/const";

interface Props {
  children: React.ReactNode;
}

const Main = styled.main`
  font-size: var(--fontsize-body-m);
  flex-grow: 1;
`;

const PageWrapper = (props: Props): JSX.Element => {
  return (
    <>
      <Head>
        {
          // TODO refactor & complete dynamic fe configuration, this works for ssr pages, but not for static pages
        }
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            // eslint-disable-next-line @typescript-eslint/naming-convention
            __html: `window.config={apiBaseUrl:"${apiBaseUrl}", authEnabled:${authEnabled}}`,
          }}
        />
      </Head>
      <Title>Tilavarauspalvelu</Title>
      <Navigation />
      <ServiceNotification />
      <Main id="main">{props.children}</Main>
      <div
        style={{
          marginTop: "var(--spacing-layout-xl)",
        }}
      />
      <Footer />
      <div id="modal-root" />
    </>
  );
};

export default PageWrapper;
