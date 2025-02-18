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
import { base64encode, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { gql } from "@apollo/client";
import {
  ApplicationSentPageDocument,
  type ApplicationSentPageQuery,
  ApplicationStatusChoice,
  type Maybe,
} from "@/gql/gql-types";
import { createApolloClient } from "@/modules/apolloClient";

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
  const pk = toNumber(ignoreMaybeArray(query.id));
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);
  const notFound = {
    notFound: true,
    props: {
      ...commonProps,
      notFound: true,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };

  if (pk == null) {
    return notFound;
  }

  const { data } = await apolloClient.query<ApplicationSentPageQuery>({
    query: ApplicationSentPageDocument,
    variables: { id: base64encode(`ApplicationNode:${pk}`) },
  });

  if (data.application == null) {
    return notFound;
  }
  const { status } = data.application;
  if (!isSent(status)) {
    return notFound;
  }

  return {
    notFound: pk == null,
    props: {
      pk,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

function isSent(status: Maybe<ApplicationStatusChoice> | undefined): boolean {
  if (status == null) {
    return false;
  }
  switch (status) {
    case ApplicationStatusChoice.Draft:
    case ApplicationStatusChoice.Expired:
    case ApplicationStatusChoice.Cancelled:
      return false;
    case ApplicationStatusChoice.Received:
    case ApplicationStatusChoice.ResultsSent:
    case ApplicationStatusChoice.Handled:
    case ApplicationStatusChoice.InAllocation:
      return true;
  }
}

export default Sent;

export const APPLICATION_SENT_PAGE_QUERY = gql`
  query ApplicationSentPage($id: ID!) {
    application(id: $id) {
      id
      pk
      status
    }
  }
`;
