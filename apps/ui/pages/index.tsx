import React, { useEffect } from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import {
  PurposeType,
  Query,
  QueryPurposesArgs,
  QueryUnitsArgs,
  UnitType,
} from "common/types/gql-types";
import { Container } from "common";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import Header from "../components/index/Header";
import SearchGuides from "../components/index/SearchGuides";
import Purposes from "../components/index/Purposes";
import Units from "../components/index/Units";
import apolloClient from "../modules/apolloClient";
import {
  RESERVATION_UNIT_PURPOSES,
  SEARCH_FORM_PARAMS_UNIT,
} from "../modules/queries/params";
import { signOut } from "../modules/auth";

type Props = {
  purposes: PurposeType[];
  units: UnitType[];
};

/// @desc
/// Our home page is also our login page, next-auth returns login errors
/// as query parameters, and the session is not automatically cleared.
/// Without this the session goes into a permanent error state
/// where it tries to signIn the invalid session and that returns always an error.
const useRedirectOnLoginError = () => {
  const { data: session } = useSession();
  const r = useRouter();
  useEffect(() => {
    if (r.query.error) {
      // eslint-disable-next-line no-console
      console.warn("Login failed with: ", r.query.error);
      signOut({ session }).then(() => {
        r.push("/");
      });
    }
  }, [r, session]);
};

const Home = ({ purposes, units }: Props): JSX.Element => {
  const { t } = useTranslation(["home", "common"]);

  useRedirectOnLoginError();

  return (
    <Container>
      <Header heading={t("head.heading")} text={t("head.text")} />
      <Purposes purposes={purposes} />
      <Units units={units} />
      <SearchGuides />
    </Container>
  );
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
      ...(await serverSideTranslations(locale, [
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
