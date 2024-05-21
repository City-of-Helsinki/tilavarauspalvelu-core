import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import {
  PurposeOrderingChoices,
  UnitOrderingChoices,
  SearchFormParamsUnitDocument,
  type SearchFormParamsUnitQuery,
  type SearchFormParamsUnitQueryVariables,
  ReservationUnitPurposesDocument,
  type ReservationUnitPurposesQuery,
  type ReservationUnitPurposesQueryVariables,
} from "@gql/gql-types";
import { Container } from "common";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import Header from "@/components/index/Header";
import SearchGuides from "@/components/index/SearchGuides";
import Purposes from "@/components/index/Purposes";
import Units from "@/components/index/Units";
import { createApolloClient } from "@/modules/apolloClient";
import { filterNonNullable } from "common/src/helpers";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

const Home = ({ purposes, units }: Props): JSX.Element => {
  const { t } = useTranslation(["home", "common"]);

  return (
    <Container>
      <Header heading={t("head.heading")} text={t("head.text")} />
      <Purposes purposes={purposes} />
      <Units units={units} />
      <SearchGuides />
    </Container>
  );
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  // TODO change these to use the new Documents
  // TODO combine the queries
  const { data: purposeData } = await apolloClient.query<
    ReservationUnitPurposesQuery,
    ReservationUnitPurposesQueryVariables
  >({
    query: ReservationUnitPurposesDocument,
    fetchPolicy: "no-cache",
    variables: {
      orderBy: [PurposeOrderingChoices.RankAsc],
    },
  });
  const purposes = filterNonNullable(
    purposeData?.purposes?.edges.map((edge) => edge?.node)
  );

  const { data: unitData } = await apolloClient.query<
    SearchFormParamsUnitQuery,
    SearchFormParamsUnitQueryVariables
  >({
    query: SearchFormParamsUnitDocument,
    fetchPolicy: "no-cache",
    variables: {
      publishedReservationUnits: true,
      orderBy: [UnitOrderingChoices.RankAsc],
    },
  });
  const units = filterNonNullable(
    unitData?.units?.edges?.map((edge) => edge?.node)
  );

  return {
    props: {
      ...commonProps,
      purposes,
      units,
      ...(await serverSideTranslations(locale ?? "fi", [
        "common",
        "home",
        "navigation",
        "footer",
        "notification",
        "errors",
      ])),
    },
  };
};

export default Home;
