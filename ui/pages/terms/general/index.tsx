import React from "react";
import { useTranslation } from "react-i18next";
import { GetServerSideProps } from "next";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  QueryTermsOfUseArgs,
  TermsOfUseType,
  Query,
} from "common/types/gql-types";
import apolloClient from "../../../modules/apolloClient";
import Sanitize from "../../../components/common/Sanitize";
import { getTranslation } from "../../../modules/util";
import { TERMS_OF_USE } from "../../../modules/queries/reservationUnit";
import Container from "../../../components/common/Container";

type Props = {
  genericTerms: TermsOfUseType;
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const { data: genericTermsData } = await apolloClient.query<
    Query,
    QueryTermsOfUseArgs
  >({
    query: TERMS_OF_USE,
    variables: {
      termsType: "generic_terms",
    },
  });
  const genericTerms =
    genericTermsData.termsOfUse?.edges
      ?.map((n) => n.node)
      .find((n) => ["generic1"].includes(n.pk)) || {};

  return {
    props: {
      genericTerms,
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Wrapper = styled(Container)`
  margin-top: var(--spacing-layout-m);
`;

const GenericTerms = ({ genericTerms }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <h1>{t("reservationCalendar:heading.generalTerms")}</h1>
      <Sanitize html={getTranslation(genericTerms, "text")} />
    </Wrapper>
  );
};

export default GenericTerms;
