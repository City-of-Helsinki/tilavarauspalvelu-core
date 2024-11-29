import { IconAngleRight } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { fontMedium, H1 } from "common";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetServerSidePropsContext } from "next";
import { applicationsPath } from "@/modules/urls";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";

const FontMedium = styled.div`
  ${fontMedium}
`;

const Paragraph = styled.p`
  white-space: pre-wrap;
  margin-bottom: var(--spacing-xl);

  @media (min-width: ${breakpoints.m}) {
    max-width: 60%;
  }
`;

function Sent(): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <BreadcrumbWrapper route={["/applications", "application"]} />
      <H1>{t("application:sent.heading")}</H1>
      <FontMedium as="p">{t("application:sent.subHeading")}</FontMedium>
      <Paragraph>{t("application:sent.body")}</Paragraph>
      <ButtonLikeLink href={applicationsPath}>
        {t("navigation:Item.applications")}
        <IconAngleRight aria-hidden="true" />
      </ButtonLikeLink>
    </>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;

  // TODO should fetch on SSR but we need authentication for it
  const { query } = ctx;
  const { id } = query;
  const pkstring = Array.isArray(id) ? id[0] : id;
  const pk = Number.isNaN(Number(pkstring)) ? undefined : Number(pkstring);
  return {
    notFound: pk == null,
    props: {
      ...getCommonServerSideProps(),
      key: locale ?? "fi",
      id: pk ?? null,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Sent;
