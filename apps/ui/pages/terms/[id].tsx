import React from "react";
import type { GetServerSidePropsContext } from "next";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import {
  type QueryTermsOfUseArgs,
  type Query,
  TermsType,
} from "common/types/gql-types";
import { H2 } from "common/src/common/typography";
import { Container } from "common";
import { TERMS_OF_USE } from "@/modules/queries/reservationUnit";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import Sanitize from "@/components/common/Sanitize";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale, params } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const genericTermsId = params?.id;
  const { data: genericTermsData } = await apolloClient.query<
    Query,
    QueryTermsOfUseArgs
  >({
    query: TERMS_OF_USE,
    variables: {
      termsType: TermsType.GenericTerms,
    },
  });
  const genericTerms = genericTermsData.termsOfUse?.edges
    ?.map((n) => n?.node)
    .find((n) => n?.pk === genericTermsId);
  if (genericTerms == null) {
    return {
      props: {
        ...commonProps,
        genericTerms: null,
      },
      notFound: true,
    };
  }
  return {
    props: {
      ...commonProps,
      genericTerms,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

const Wrapper = styled(Container).attrs({ size: "s" })`
  margin-bottom: var(--spacing-layout-l);
`;

const Heading = styled(H2).attrs({ as: "h1" })``;

const GenericTerms = ({ genericTerms }: Props): JSX.Element => {
  const { i18n } = useTranslation();

  if (genericTerms == null) {
    return <div>404</div>;
  }

  const lang = convertLanguageCode(i18n.language);
  const title = getTranslationSafe(genericTerms, "name", lang);
  const text = getTranslationSafe(genericTerms, "text", lang);

  return (
    <Wrapper>
      <Heading>{title} </Heading>
      <Sanitize html={text} style={{ whiteSpace: "pre-wrap" }} />
    </Wrapper>
  );
};

export default GenericTerms;
