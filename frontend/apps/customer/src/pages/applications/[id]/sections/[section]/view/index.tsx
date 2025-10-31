import React from "react";
import { gql } from "@apollo/client";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getTranslation } from "ui/src/modules/util";
import { H1 } from "ui/src/styled";
import { getLocalizationLang } from "@ui/modules/helpers";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AllReservations } from "@/components/application/ApprovedReservations";
import { createApolloClient } from "@/modules/apolloClient";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { applicationsPrefix, getApplicationPath } from "@/modules/urls";
import {
  ApplicationSectionViewDocument,
  type ApplicationSectionViewQuery,
  type ApplicationSectionViewQueryVariables,
  ApplicationStatusChoice,
} from "@gql/gql-types";

function ViewAll({ applicationSection }: PropsNarrowed): JSX.Element {
  const { t, i18n } = useTranslation();
  const headingPrefix = t("application:view.allReservations");
  const heading = `${applicationSection.name} - ${headingPrefix}`;
  const { application } = applicationSection;
  const { applicationRound } = application;
  const lang = getLocalizationLang(i18n.language);
  const route = [
    {
      slug: applicationsPrefix,
      title: t("breadcrumb:applications"),
    },
    {
      slug: getApplicationPath(application.pk, "view"),
      title: getTranslation(applicationRound, "name", lang),
    },
    {
      title: applicationSection.name,
    },
  ] as const;

  return (
    <>
      <Breadcrumb routes={route} />
      <H1 $noMargin>{heading}</H1>
      <AllReservations applicationSection={applicationSection} application={application} />
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

  const { data } = await apolloClient.query<ApplicationSectionViewQuery, ApplicationSectionViewQueryVariables>({
    query: ApplicationSectionViewDocument,
    variables: { pk },
  });

  const applicationSection = data?.applicationSections?.edges[0]?.node;
  if (!applicationSection) {
    return notFoundRetvalue;
  }
  const { application } = applicationSection;
  const showReservations = application.status === ApplicationStatusChoice.ResultsSent;
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
