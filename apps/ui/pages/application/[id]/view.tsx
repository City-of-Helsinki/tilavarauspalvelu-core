import React from "react";
import Error from "next/error";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import type {
  Query,
  QueryTermsOfUseArgs,
  TermsOfUseType,
} from "common/types/gql-types";
import { getTranslation } from "common/src/common/util";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { filterNonNullable } from "common/src/helpers";
import { BlackButton } from "@/styles/util";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import { createApolloClient } from "@/modules/apolloClient";
import { TERMS_OF_USE } from "@/modules/queries/reservationUnit";
import { ViewInner } from "@/components/application/ViewInner";
import { ButtonContainer, CenterSpinner } from "@/components/common/common";
import { useApplicationQuery } from "@/hooks/useApplicationQuery";
import { getCommonServerSideProps } from "@/modules/serverUtils";

type Props = {
  id?: number;
  tos: TermsOfUseType[];
};

const View = ({ id, tos }: Props): JSX.Element => {
  const { t } = useTranslation();

  const router = useRouter();
  const { application, error, isLoading } = useApplicationQuery(id);

  if (id == null) {
    return <Error statusCode={404} />;
  }
  if (error) {
    // eslint-disable-next-line no-console -- TODO use logger (sentry)
    console.error("application query error: ", error);
    return <Error statusCode={500} />;
  }
  if (isLoading) {
    return <CenterSpinner />;
  }
  if (!application) {
    return <Error statusCode={404} />;
  }

  const round = application.applicationRound;
  const applicationRoundName =
    round != null ? getTranslation(round, "name") : "-";

  return (
    <ApplicationPageWrapper
      translationKeyPrefix="application:view"
      headContent={applicationRoundName}
      application={application}
    >
      <ViewInner application={application} tos={tos} />
      <ButtonContainer>
        <BlackButton variant="secondary" onClick={() => router.back()}>
          {t("common:prev")}
        </BlackButton>
      </ButtonContainer>
    </ApplicationPageWrapper>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { locale } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const { data: tosData } = await apolloClient.query<
    Query,
    QueryTermsOfUseArgs
  >({
    query: TERMS_OF_USE,
  });

  const tos = filterNonNullable(
    tosData?.termsOfUse?.edges?.map((e) => e?.node)
  ).filter((n) => n?.pk === "KUVAnupa" || n?.pk === "booking");

  // TODO should fetch on SSR but we need authentication for it
  const { query } = ctx;
  const { id } = query;
  const pkstring = Array.isArray(id) ? id[0] : id;
  const pk = Number.isNaN(Number(pkstring)) ? undefined : Number(pkstring);

  return {
    props: {
      ...commonProps,
      key: locale,
      id: pk,
      tos,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

export default View;
