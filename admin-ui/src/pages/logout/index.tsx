import React from "react";
import getConfig from "next/config";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import KorosHeading, { Heading } from "app/component/KorosHeading";
import { HERO_IMAGE_URL } from "app/common/const";
import Footer from "app/component/Footer";
import Navigation from "app/component/Navigation";

const Wrapper = styled.main`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const Ingress = styled.p`
  font-size: 1.5rem;
  line-height: 1.8125rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
`;

const {
  publicRuntimeConfig: { tunnistamoUrl },
} = getConfig();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <Wrapper>
    {children}
    <Footer />
  </Wrapper>
);

const LogoutPage = () => {
  const { t } = useTranslation();
  const TUNNISTAMO_LOGOUT_URL = `${tunnistamoUrl}/logout/`;

  // TODO translations (requires adding i18n to next or rewriting this as a client only component)
  return (
    <Layout>
      <Navigation disabledRouter />
      <KorosHeading heroImage={HERO_IMAGE_URL}>
        <Heading>{t("common.applicationName")}</Heading>
        <p style={{ fontSize: "1.8rem" }}>You have signed out from Varaamo</p>
      </KorosHeading>
      <Ingress>
        <a href={TUNNISTAMO_LOGOUT_URL}>
          Sign out from other Helsinki services also
        </a>
      </Ingress>
    </Layout>
  );
};

export default LogoutPage;
