import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { TermsType, TermsOfUseDocument, type TermsOfUseQuery, type TermsOfUseQueryVariables } from "@gql/gql-types";
import { H1 } from "common/styled";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import { Sanitize } from "common/src/components/Sanitize";
import { convertLanguageCode, getTranslationSafe } from "common/src/common/util";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale, params } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const genericTermsId = params?.id;
  const { data } = await apolloClient.query<TermsOfUseQuery, TermsOfUseQueryVariables>({
    query: TermsOfUseDocument,
    variables: {
      termsType: TermsType.GenericTerms,
    },
  });
  const genericTerms = data.termsOfUse?.edges?.map((n) => n?.node).find((n) => n?.pk === genericTermsId);
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

const GenericTerms = ({ genericTerms }: Props): JSX.Element => {
  const { i18n } = useTranslation();

  if (genericTerms == null) {
    return <div>404</div>;
  }

  const lang = convertLanguageCode(i18n.language);
  const title = getTranslationSafe(genericTerms, "name", lang);
  const text = getTranslationSafe(genericTerms, "text", lang);

  return (
    <>
      <H1>{title}</H1>
      <Sanitize html={text} />
    </>
  );
};

export default GenericTerms;
