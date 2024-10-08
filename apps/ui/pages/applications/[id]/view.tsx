import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { getTranslationSafe } from "common/src/common/util";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { createApolloClient } from "@/modules/apolloClient";
import { ViewInner } from "@/components/application/ViewInner";
import {
  getCommonServerSideProps,
  getGenericTerms,
} from "@/modules/serverUtils";
import { base64encode, getLocalizationLang } from "common/src/helpers";
import { ApplicationDocument, ApplicationQuery } from "@gql/gql-types";
import { Tabs } from "hds-react";
import { Head } from "@/components/application/Head";
import { Container } from "common";
import { formatDateTime } from "@/modules/util";
import { ApprovedReservations } from "@/components/application/ApprovedReservations";

function View({ application, tos }: PropsNarrowed): JSX.Element {
  const { t, i18n } = useTranslation();

  type TabOptions = "reservations" | "application";
  const [tab, setTab] = useState<TabOptions>("reservations");

  const handleTabChange = (tab_: TabOptions) => {
    setTab(tab_);
  };

  const round = application.applicationRound;
  const lang = getLocalizationLang(i18n.language);
  const applicationRoundName = getTranslationSafe(round, "name", lang);
  const { sentDate } = application.applicationRound;
  const handledDate = sentDate ? new Date(sentDate) : null;

  return (
    <Container>
      <Head heading={applicationRoundName} />
      {handledDate ? (
        <>
          <p>
            {/* TODO format date should not include the day name */}
            {t("application:view.handledDate")} {formatDateTime(t, handledDate)}
          </p>
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
              <ApprovedReservations application={application} />
            </Tabs.TabPanel>
            <Tabs.TabPanel>
              <ViewInner application={application} tos={tos} />
            </Tabs.TabPanel>
          </Tabs>
        </>
      ) : (
        <ViewInner application={application} tos={tos} />
      )}
    </Container>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const tos = await getGenericTerms(apolloClient);

  const { query } = ctx;
  const { id } = query;

  const pkstring = Array.isArray(id) ? id[0] : id;
  const pk = Number.isNaN(Number(pkstring)) ? undefined : Number(pkstring);

  const notFoundRetvalue = {
    props: {
      notFound: true,
      ...commonProps,
    },
    notFound: true,
  };

  if (pk == null) {
    return notFoundRetvalue;
  }

  const { data } = await apolloClient.query<ApplicationQuery>({
    query: ApplicationDocument,
    variables: { id: base64encode(`ApplicationNode:${pk}`) },
  });

  if (!data?.application) {
    return notFoundRetvalue;
  }

  return {
    props: {
      ...commonProps,
      application: data.application,
      tos,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default View;
