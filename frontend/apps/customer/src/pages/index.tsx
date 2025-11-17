import React from "react";
import { gql } from "@apollo/client";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { filterNonNullable } from "@ui/modules/helpers";
import { Head, IntendedUses, SearchGuides, Units } from "@/lib/index";
import { createApolloClient } from "@/modules/apolloClient";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { IntendedUseOrderingChoices, UnitOrderingChoices, FrontPageDocument } from "@gql/gql-types";
import type { FrontPageQuery, FrontPageQueryVariables } from "@gql/gql-types";

function Home({ intendedUses, units }: Props): JSX.Element {
  const { t } = useTranslation(["home", "common"]);

  return (
    <>
      <Head heading={t("head.heading")} text={t("head.text")} />
      <IntendedUses intendedUses={intendedUses} />
      <Units units={units} />
      <SearchGuides />
    </>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;
  const { apiBaseUrl } = getCommonServerSideProps();
  const apolloClient = createApolloClient(apiBaseUrl, ctx);

  const { data } = await apolloClient.query<FrontPageQuery, FrontPageQueryVariables>({
    query: FrontPageDocument,
    variables: {
      orderBy: [IntendedUseOrderingChoices.RankAsc],
      orderUnitsBy: [UnitOrderingChoices.RankAsc],
    },
  });
  const intendedUses = filterNonNullable(data?.intendedUses?.edges.map((edge) => edge?.node));
  const units = filterNonNullable(data?.units?.edges.map((edge) => edge?.node));

  return {
    props: {
      intendedUses,
      units,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Home;

// TODO we can limit the number of intended uses and units fetched
export const FRONT_PAGE_QUERY = gql`
  query FrontPage($orderBy: [IntendedUseOrderingChoices], $orderUnitsBy: [UnitOrderingChoices]) {
    intendedUses(orderBy: $orderBy) {
      edges {
        node {
          ...IntendedUseCard
        }
      }
    }
    units(publishedReservationUnits: true, orderBy: $orderUnitsBy) {
      edges {
        node {
          ...UnitListFields
        }
      }
    }
  }
`;
