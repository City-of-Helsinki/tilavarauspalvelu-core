import { IconAngleRight } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { H1 } from "common";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetServerSidePropsContext } from "next";
import {
  applicationsPath,
  applicationsPrefix,
  getApplicationPath,
} from "@/modules/urls";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";
import { toNumber } from "common/src/helpers";

const Paragraph = styled.p`
  max-width: var(--prose-width);
`;

function Sent({ pk }: PropsNarrowed): JSX.Element {
  const { t } = useTranslation();

  const routes = [
    {
      slug: applicationsPrefix,
      title: t("breadcrumb:applications"),
    },
    {
      slug: getApplicationPath(pk, "view"),
      title: t("breadcrumb:application"),
    },
    {
      title: t("application:sent.heading"),
    },
  ] as const;

  return (
    <>
      <Breadcrumb routes={routes} />
      <div>
        <H1 $noMargin>{t("application:sent.heading")}</H1>
        <Paragraph>{t("application:sent.subHeading")}</Paragraph>
      </div>
      <Paragraph>{t("application:sent.body")}</Paragraph>
      <div>
        <ButtonLikeLink href={applicationsPath}>
          {t("navigation:Item.applications")}
          <IconAngleRight aria-hidden="true" />
        </ButtonLikeLink>
      </div>
    </>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, query } = ctx;
  const { id } = query;
  // TODO should fetch the application here to check it's actually sent
  const pkstring = Array.isArray(id) ? id[0] : id;
  const pk = toNumber(pkstring);
  return {
    notFound: pk == null,
    props: {
      pk,
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Sent;
