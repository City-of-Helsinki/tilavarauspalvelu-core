import React from "react";
import Error from "next/error";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { getTranslation } from "common/src/common/util";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { BlackButton } from "@/styles/util";
import { ApplicationPageWrapper } from "@/components/application/ApplicationPage";
import { createApolloClient } from "@/modules/apolloClient";
import { ViewInner } from "@/components/application/ViewInner";
import { ButtonContainer, CenterSpinner } from "@/components/common/common";
import { useApplicationQuery } from "@/hooks/useApplicationQuery";
import {
  getCommonServerSideProps,
  getGenericTerms,
} from "@/modules/serverUtils";

const View = ({ id, tos }: Props): JSX.Element => {
  const { t } = useTranslation();

  const router = useRouter();
  const { application, error, isLoading } = useApplicationQuery(
    id ?? undefined
  );

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

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const tos = await getGenericTerms(apolloClient);

  // TODO should fetch on SSR but we need authentication for it
  const { query } = ctx;
  const { id } = query;
  const pkstring = Array.isArray(id) ? id[0] : id;
  const pk = Number.isNaN(Number(pkstring)) ? undefined : Number(pkstring);

  return {
    props: {
      ...commonProps,
      key: locale ?? "fi",
      id: pk ?? null,
      tos,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

export default View;
