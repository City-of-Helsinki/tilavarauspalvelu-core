import React from "react";
import { useTranslation } from "next-i18next";
import { GetServerSideProps } from "next";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  QueryTermsOfUseArgs,
  TermsOfUseType,
  Query,
  TermsOfUseTermsOfUseTermsTypeChoices,
} from "common/types/gql-types";
import { H2 } from "common/src/common/typography";
import apolloClient from "../../../modules/apolloClient";
import Sanitize from "../../../components/common/Sanitize";
import { getTranslation } from "../../../modules/util";
import { TERMS_OF_USE } from "../../../modules/queries/reservationUnit";
import { ExtraNarrowCenteredContainer } from "../../../modules/style/layout";

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
      termsType: TermsOfUseTermsOfUseTermsTypeChoices.GenericTerms,
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

const Wrapper = styled(ExtraNarrowCenteredContainer)`
  margin-top: var(--spacing-l);
  margin-bottom: var(--spacing-l);
`;

const Heading = styled(H2).attrs({ as: "h1" })``;

const GenericTerms = ({ genericTerms }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <Heading>{t("reservationCalendar:heading.generalTerms")}</Heading>
      <Sanitize
        html={getTranslation(genericTerms, "text")}
        style={{ whiteSpace: "pre-wrap" }}
      />
    </Wrapper>
  );
};

export default GenericTerms;
