import { createClient } from "@/common/apolloClient";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { TermsOfUseDocument, type TermsOfUseQuery, type TermsOfUseQueryVariables, TermsType } from "@gql/gql-types";
import TermsContent from "common/src/components/TermsContent";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React from "react";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale, params } = ctx;
  const commonProps = await getCommonServerSideProps();
  const apolloClient = createClient(commonProps.apiBaseUrl, ctx.req);

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
