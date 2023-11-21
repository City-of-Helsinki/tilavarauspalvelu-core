import { Button, IconAngleRight } from "hds-react";
import { useRouter } from "next/router";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { Container } from "common";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetServerSideProps } from "next";
import { applicationsUrl } from "@/modules/util";
import Head from "@/components/application/Head";

const Paragraph = styled.p`
  white-space: pre-wrap;
  margin-bottom: var(--spacing-xl);

  @media (min-width: ${breakpoints.m}) {
    max-width: 60%;
  }
`;

const StyledButton = styled(Button)`
  margin-bottom: var(--spacing-layout-l);
`;

const Sent = (): JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      <Head heading={t("application:sent.heading")}>
        <p>{t("application:sent.subHeading")}</p>
      </Head>
      <Container>
        <Paragraph>{t("application:sent.body")}</Paragraph>
        <StyledButton
          onClick={() => router.push(applicationsUrl)}
          iconRight={<IconAngleRight />}
          size="small"
        >
          {t("navigation:Item.applications")}
        </StyledButton>
      </Container>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { locale } = ctx;

  // TODO should fetch on SSR but we need authentication for it
  const { query } = ctx;
  const { id } = query;
  const pkstring = Array.isArray(id) ? id[0] : id;
  const pk = Number.isNaN(Number(pkstring)) ? undefined : Number(pkstring);
  return {
    props: {
      key: locale,
      id: pk,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

export default Sent;
