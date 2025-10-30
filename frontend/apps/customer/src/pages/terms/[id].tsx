import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import {
  TermsOfUseDocument,
  type TermsOfUseQuery,
  type TermsOfUseQueryVariables,
  TermsOfUseTypeChoices,
} from "@gql/gql-types";
import { H1 } from "ui/src/styled";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import { Sanitize } from "ui/src/components/Sanitize";
import { convertLanguageCode, getTranslationSafe } from "ui/src/modules/util";
import { ignoreMaybeArray } from "ui/src/modules/helpers";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale, params } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const genericTermsId = ignoreMaybeArray(params?.id);
  const { data } = await apolloClient.query<TermsOfUseQuery, TermsOfUseQueryVariables>({
    query: TermsOfUseDocument,
    variables: {
      termsType: TermsOfUseTypeChoices.GenericTerms,
      pk: genericTermsId ?? "",
    },
  });
  const genericTerms = data.termsOfUse?.edges?.map((n) => n?.node).find(() => true) ?? null;

  if (genericTerms == null) {
    return {
      props: {
        ...commonProps,
        notFound: true,
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

function GenericTerms({ genericTerms }: PropsNarrowed): JSX.Element {
  const { i18n } = useTranslation();

  const lang = convertLanguageCode(i18n.language);
  const title = getTranslationSafe(genericTerms, "name", lang);
  const text = getTranslationSafe(genericTerms, "text", lang);

  return (
    <>
      <H1>{title}</H1>
      <Sanitize html={text} />
    </>
  );
}

export default GenericTerms;
