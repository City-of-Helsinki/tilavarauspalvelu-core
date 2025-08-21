import TermsContent from "common/src/components/TermsContent";
import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { TermsType, TermsOfUseDocument, type TermsOfUseQuery, type TermsOfUseQueryVariables } from "@gql/gql-types";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";

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

const GenericTerms = ({ genericTerms }: Props): JSX.Element => <TermsContent genericTerms={genericTerms} />;

export default GenericTerms;
