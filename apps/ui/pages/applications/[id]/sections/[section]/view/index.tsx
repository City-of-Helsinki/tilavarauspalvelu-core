import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { createApolloClient } from "@/modules/apolloClient";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import {
  ApplicationSectionViewDocument,
  type ApplicationSectionViewQuery,
  type ApplicationSectionViewQueryVariables,
  ApplicationStatusChoice,
} from "@gql/gql-types";
import { H1 } from "common";
import { AllReservations } from "@/components/application/ApprovedReservations";
import { gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { getApplicationPath } from "@/modules/urls";

function ViewAll({ applicationSection }: PropsNarrowed): JSX.Element {
  const { t, i18n } = useTranslation();
  const headingPrefix = t("application:view.allReservations");
  const heading = `${applicationSection.name} - ${headingPrefix}`;
  const { application } = applicationSection;
  const { applicationRound } = application;
  const lang = convertLanguageCode(i18n.language);
  const route = [
    {
      slug: "/applications",
      title: t("breadcrumb:applications"),
    },
    {
      slug: getApplicationPath(application.pk, "view"),
      title: getTranslationSafe(applicationRound, "name", lang),
    },
    {
      slug: "",
      title: applicationSection.name,
    },
  ];
  return (
    <>
      <BreadcrumbWrapper route={route} />
      <H1 $noMargin>{heading}</H1>
      <AllReservations
        applicationSection={applicationSection}
        application={application}
      />
    </>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

// TODO should have a relay query for application sections
export const APPLICATION_SECTION_VIEW_QUERY = gql`
  query ApplicationSectionView($pk: Int!, $beginDate: Date = null) {
    applicationSections(pk: [$pk]) {
      edges {
        node {
          ...ApplicationSectionReservation
          application {
            id
            pk
            status
            applicationRound {
              id
              nameEn
              nameFi
              nameSv
            }
          }
        }
      }
    }
  }
`;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const { query } = ctx;
  const { section } = query;

  const pkstring = Array.isArray(section) ? section[0] : section;
  const pk = Number.isNaN(Number(pkstring)) ? undefined : Number(pkstring);

  const notFoundRetvalue = {
    props: {
      notFound: true,
      ...commonProps,
    },
    notFound: true,
  };

  if (pk == null) {
    return notFoundRetvalue;
  }

  const { data } = await apolloClient.query<
    ApplicationSectionViewQuery,
    ApplicationSectionViewQueryVariables
  >({
    query: ApplicationSectionViewDocument,
    variables: { pk },
  });

  const applicationSection = data?.applicationSections?.edges[0]?.node;
  if (!applicationSection) {
    return notFoundRetvalue;
  }
  const { application } = applicationSection;
  const showReservations =
    application.status === ApplicationStatusChoice.ResultsSent;
  if (!showReservations) {
    return notFoundRetvalue;
  }

  return {
    props: {
      ...commonProps,
      applicationSection,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default ViewAll;
