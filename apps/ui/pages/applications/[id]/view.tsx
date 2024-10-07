import React, { useState } from "react";
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
import {
  getCommonServerSideProps,
  getGenericTerms,
} from "@/modules/serverUtils";
import { base64encode } from "common/src/helpers";
import { useApplicationQuery } from "@gql/gql-types";
import { Tabs } from "hds-react";

function View({ id: pk, tos }: Props): JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  const id = base64encode(`ApplicationNode:${pk}`);
  const {
    data,
    error,
    loading: isLoading,
  } = useApplicationQuery({
    variables: { id },
    skip: !pk,
  });
  const { application } = data ?? {};

  // TODO move to query var
  type TabOptions = "reservations" | "application";
  const [tab, setTab] = useState<TabOptions>("reservations");

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

  const handleTabChange = (tab_: TabOptions) => {
    setTab(tab_);
  };

  const round = application.applicationRound;
  const applicationRoundName =
    round != null ? getTranslation(round, "name") : "-";

  return (
    <ApplicationPageWrapper
      translationKeyPrefix="application:view"
      headContent={applicationRoundName}
      application={application}
    >
      <Tabs initiallyActiveTab={tab === "application" ? 1 : 0}>
        <Tabs.TabList>
          <Tabs.Tab onClick={() => handleTabChange("reservations")}>
            {t("application:view.reservations")}
          </Tabs.Tab>
          <Tabs.Tab onClick={() => handleTabChange("application")}>
            {t("application:view.application")}
          </Tabs.Tab>
        </Tabs.TabList>
        <Tabs.TabPanel>
          <ReservationsList />
        </Tabs.TabPanel>
        <Tabs.TabPanel>
          <ViewInner application={application} tos={tos} />
        </Tabs.TabPanel>
      </Tabs>
      <ButtonContainer>
        <BlackButton variant="secondary" onClick={() => router.back()}>
          {t("common:prev")}
        </BlackButton>
      </ButtonContainer>
    </ApplicationPageWrapper>
  );
}

function ReservationsList() {
  return <div>ReservationsList: TODO</div>;
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
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
}

export default View;
