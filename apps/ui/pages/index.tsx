import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import {
  PurposeOrderSet,
  UnitOrderSet,
  type FrontPageQuery,
  type FrontPageQueryVariables,
  FrontPageDocument,
} from "@gql/gql-types";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { Head } from "@/components/index/Header";
import { Purposes } from "@/components/index/Purposes";
import { SearchGuides } from "@/components/index/SearchGuides";
import { Units } from "@/components/index/Units";
import { createApolloClient } from "@/modules/apolloClient";
import { filterNonNullable } from "common/src/helpers";
import { gql } from "@apollo/client";

function Home({ purposes, units }: Props): JSX.Element {
  const { t } = useTranslation(["home", "common"]);

  return (
    <>
      <Head heading={t("head.heading")} text={t("head.text")} />
      <Purposes purposes={purposes} />
      <Units units={units} />
      <SearchGuides />
    </>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const { data } = await apolloClient.query<FrontPageQuery, FrontPageQueryVariables>({
    query: FrontPageDocument,
    fetchPolicy: "no-cache",
    variables: {
      orderBy: [PurposeOrderSet.RankAsc],
      orderUnitsBy: [UnitOrderSet.RankAsc],
    },
  });
  const purposes = filterNonNullable(data?.purposes?.edges.map((edge) => edge?.node));
  const units = filterNonNullable(data?.units?.edges.map((edge) => edge?.node));

  return {
    props: {
      ...commonProps,
      purposes,
      units,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Home;

// TODO we can limit the number of purposes and units fetched
export const FRONT_PAGE_QUERY = gql`
  query FrontPage(
    $orderBy: [PurposeOrderSet]
    # Filter
    $orderUnitsBy: [UnitOrderSet!]
  ) {
    purposes(orderBy: $orderBy) {
      edges {
        node {
          ...PurposeCard
        }
      }
    }
    units(orderBy: $orderUnitsBy, filter: { publishedReservationUnits: true }) {
      edges {
        node {
          ...UnitListFields
        }
      }
    }
  }
`;
