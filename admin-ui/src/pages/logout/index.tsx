import React from "react";
import getConfig from "next/config";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import KorosHeading, { Heading } from "app/component/KorosHeading";
import { HERO_IMAGE_URL } from "app/common/const";
import Footer from "app/component/Footer";
import Navigation from "app/component/Navigation";
import ClientOnly from "app/component/ClientOnly";
import BaseLayout from "../layout";

// NOTE not using App.tsx so need to import i18n here also
import "app/i18n";

// TODO move these to a common layout (PageWrapper, copies from)
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
  <BaseLayout>
    <Wrapper>{children}</Wrapper>
  </BaseLayout>
);

const LogoutPage = () => {
  const { t } = useTranslation(["common", "logout"]);
  const TUNNISTAMO_LOGOUT_URL = `${tunnistamoUrl}/logout/`;

  // FIXME i18n breaks SSR
  return (
    <Layout>
      <ClientOnly>
        <Navigation disabledRouter />
        <KorosHeading heroImage={HERO_IMAGE_URL}>
          <Heading>{t("common:applicationName")}</Heading>
          <p style={{ fontSize: "1.8rem" }}>{t("logout:message")}</p>
        </KorosHeading>
        <Ingress>
          <a href={TUNNISTAMO_LOGOUT_URL}>
            {t("logout:signOutFromOtherServices")}
          </a>
        </Ingress>
        <Footer />
      </ClientOnly>
    </Layout>
  );
};

export default LogoutPage;
