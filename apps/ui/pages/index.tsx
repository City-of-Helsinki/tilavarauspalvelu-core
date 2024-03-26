import React from "react";
import { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import {
  PurposeOrderingChoices,
  UnitOrderingChoices,
  type Query,
  type QueryPurposesArgs,
  type QueryUnitsArgs,
} from "common/types/gql-types";
import { Container } from "common";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import Header from "@/components/index/Header";
import SearchGuides from "@/components/index/SearchGuides";
import Purposes from "@/components/index/Purposes";
import Units from "@/components/index/Units";
import { createApolloClient } from "@/modules/apolloClient";
import {
  RESERVATION_UNIT_PURPOSES,
  SEARCH_FORM_PARAMS_UNIT,
} from "@/modules/queries/params";
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

  const { data: purposeData } = await apolloClient.query<
    Query,
    QueryPurposesArgs
  >({
    query: RESERVATION_UNIT_PURPOSES,
    fetchPolicy: "no-cache",
    variables: {
      orderBy: [PurposeOrderingChoices.RankAsc],
      // "rank",
    },
  });
  const purposes = filterNonNullable(
    purposeData?.purposes?.edges.map((edge) => edge?.node)
  );

  const { data: unitData } = await apolloClient.query<Query, QueryUnitsArgs>({
    query: SEARCH_FORM_PARAMS_UNIT,
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
