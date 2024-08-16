import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import ClientOnly from "common/src/ClientOnly";
import KorosHeading, { Heading } from "@/component/KorosHeading";
import { HERO_IMAGE_URL } from "@/common/const";
import Navigation from "@/component/Navigation";
import { env } from "@/env.mjs";
import BaseLayout from "../../layout";
// NOTE not using App.tsx so need to import i18n here also
import "@/i18n";
import { getVersion } from "@/helpers/serverUtils";

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

function Layout(props: { children: React.ReactNode } & Pick<Props, "version">) {
  const { children, version } = props;
  return (
    <BaseLayout version={version}>
      <Wrapper>{children}</Wrapper>
    </BaseLayout>
  );
}

function LogoutPage({ apiBaseUrl, logoutUrl, version }: Props) {
  const { t } = useTranslation(["common", "logout"]);

  // Can't use SSR because of translations
  return (
    <Layout version={version}>
      <ClientOnly>
        <Navigation apiBaseUrl={apiBaseUrl} />
        <KorosHeading heroImage={HERO_IMAGE_URL}>
          <Heading>{t("common:applicationName")}</Heading>
          <p style={{ fontSize: "1.8rem" }}>{t("logout:message")}</p>
        </KorosHeading>
        <Ingress>
          <a href={logoutUrl}>{t("logout:signOutFromOtherServices")}</a>
        </Ingress>
      </ClientOnly>
    </Layout>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export async function getServerSideProps() {
  const logoutUrl = env.TUNNISTAMO_URL ? `${env.TUNNISTAMO_URL}/logout/` : "";
  const apiBaseUrl = env.TILAVARAUS_API_URL ?? "";
  return {
    props: {
      logoutUrl,
      apiBaseUrl,
      version: getVersion(),
      // TODO can't use SSR translations because our translations aren't in public folder
      // ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default LogoutPage;
