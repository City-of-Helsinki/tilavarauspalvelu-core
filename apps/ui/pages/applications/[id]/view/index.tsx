import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { getTranslationSafe } from "common/src/common/util";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { createApolloClient } from "@/modules/apolloClient";
import { ViewApplication } from "@/components/application/ViewApplication";
import {
  getCommonServerSideProps,
  getGenericTerms,
} from "@/modules/serverUtils";
import { base64encode, getLocalizationLang } from "common/src/helpers";
import {
  ApplicationStatusChoice,
  ApplicationViewDocument,
  type ApplicationViewQuery,
} from "@gql/gql-types";
import { Tabs } from "hds-react";
import { Head } from "@/components/application/Head";
import { Container } from "common";
import { formatDateTime } from "@/modules/util";
import { ApprovedReservations } from "@/components/application/ApprovedReservations";
import { gql } from "@apollo/client";

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
  const handledDate = sentDate ? new Date(sentDate) : new Date();
  const showReservations =
    application.status === ApplicationStatusChoice.ResultsSent;

  return (
    <Container>
      <Head heading={applicationRoundName} />
      {showReservations ? (
        <>
          <p>
            {t("application:view.handledDate")}{" "}
            {formatDateTime(t, handledDate, false)}
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
              <ViewApplication application={application} tos={tos} />
            </Tabs.TabPanel>
          </Tabs>
        </>
      ) : (
        <ViewApplication application={application} tos={tos} />
      )}
    </Container>
  );
}

// TODO refactor this by splitting the query based on tab
// it includes all the application section information that is not required by by the View Application tab
// the reservations tab doesn't need to know what the user applied for but what they got.
// The query is already too complex at 22 complexity (requires backend changes to add more fields).
// Terms of use is only required by the application tab.
// ApplicationCommon fragment needs to be refactored so we have a separate minimal fragments for
// - reservation tab
// - application tab
// They can both be included in the SSR query
// (or alternatively the reservation tab can be fetched on the client side per each applicationSection)
export const APPLICATION_VIEW_QUERY = gql`
  query ApplicationView($id: ID!) {
    application(id: $id) {
      ...ApplicationCommon
      applicationRound {
        id
        sentDate
        termsOfUse {
          id
          ...TermsOfUseFields
        }
      }
    }
  }
`;

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

  const { data } = await apolloClient.query<ApplicationViewQuery>({
    query: ApplicationViewDocument,
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
