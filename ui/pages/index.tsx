import React from "react";
import styled from "styled-components";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import Header from "../components/index/Header";
import SearchGuides from "../components/index/SearchGuides";
import Purposes from "../components/index/Purposes";
import Units from "../components/index/Units";
import apolloClient from "../modules/apolloClient";
import {
  PurposeType,
  Query,
  QueryPurposesArgs,
  QueryUnitsArgs,
  UnitType,
} from "../modules/gql-types";
import {
  RESERVATION_UNIT_PURPOSES,
  SEARCH_FORM_PARAMS_UNIT,
} from "../modules/queries/params";

type Props = {
  purposes: PurposeType[];
  units: UnitType[];
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const { data: purposeData } = await apolloClient.query<
    Query,
    QueryPurposesArgs
  >({
    query: RESERVATION_UNIT_PURPOSES,
    fetchPolicy: "no-cache",
    variables: {
      orderBy: "rank",
    },
  });

  const purposes = purposeData.purposes.edges.map((edge) => edge.node);

  const { data: unitData } = await apolloClient.query<Query, QueryUnitsArgs>({
    query: SEARCH_FORM_PARAMS_UNIT,
    fetchPolicy: "no-cache",
    variables: {
      publishedReservationUnits: true,
      orderBy: "rank",
    },
  });

  const units = unitData?.units?.edges?.map((edge) => edge.node);

  return {
    props: {
      purposes,
      units,
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Wrapper = styled.div`
  background-color: var(--color-white);
`;

const Home = ({ purposes, units }: Props): JSX.Element => {
  const { t } = useTranslation("home");

  return (
    <Wrapper>
      <Header heading={t("head.heading")} text={t("head.text")} />
      <Purposes purposes={purposes} />
      <Units units={units} />
      <SearchGuides />
    </Wrapper>
  );
};

export default Home;
