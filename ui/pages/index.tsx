import React from "react";
import styled from "styled-components";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import Header from "../components/index/Header";
import SearchGuides from "../components/index/SearchGuides";
import Units from "../components/index/Units";
import apolloClient from "../modules/apolloClient";
import { Query, QueryUnitsArgs, UnitType } from "../modules/gql-types";
import { SEARCH_FORM_PARAMS_UNIT } from "../modules/queries/params";

type Props = {
  units: UnitType[];
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const { data } = await apolloClient.query<Query, QueryUnitsArgs>({
    query: SEARCH_FORM_PARAMS_UNIT,
    fetchPolicy: "no-cache",
    variables: {
      publishedReservationUnits: true,
      orderBy: "rank",
    },
  });

  const units = data?.units?.edges?.map((edge) => edge.node);

  return {
    props: {
      units,
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Wrapper = styled.div`
  background-color: var(--color-white);
`;

const Home = ({ units }: Props): JSX.Element => {
  const { t } = useTranslation("home");

  return (
    <Wrapper>
      <Header heading={t("head.heading")} text={t("head.text")} />
      <Units units={units} />
      <SearchGuides />
    </Wrapper>
  );
};

export default Home;
