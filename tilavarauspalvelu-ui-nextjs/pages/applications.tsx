import React from "react";
import { groupBy } from "lodash";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { TFunction } from "next-i18next";
import { useApiData } from "../hooks/useApiData";
import { getApplicationRounds, getApplications } from "../modules/api";
import { isBrowser } from "../modules/const";
import {
  Application,
  ApplicationRound,
  ReducedApplicationStatus,
} from "../modules/types";
import { getReducedApplicationStatus } from "../modules/util";
import Head from "../components/applications/Head";
import Loader from "../components/common/Loader";
import ApplicationsGroup from "../components/applications/ApplicationsGroup";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
    revalidate: 100, // In seconds
  };
}

const Container = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-m);
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  font-size: var(--fontsize-body-xl);
  height: 100%;
`;

const statusGroupOrder: ReducedApplicationStatus[] = [
  "sent",
  "processing",
  "draft",
  "declined",
  "cancelled",
];

function ApplicationGroups({
  rounds,
  applications,
  t,
}: {
  rounds: { [key: number]: ApplicationRound };
  applications: { [key: string]: Application[] };
  t: TFunction;
}): JSX.Element {
  if (Object.keys(applications).length === 0) {
    return <span>{t("applications:noApplications")}</span>;
  }
  return (
    <>
      {statusGroupOrder.map((gr) => (
        <ApplicationsGroup
          key={gr}
          name={t(`applications:group.${gr}`)}
          rounds={rounds}
          applications={applications[gr] || []}
        />
      ))}
    </>
  );
}

const Applications = (): JSX.Element => {
  const OidcSecure = dynamic(() =>
    import("@axa-fr/react-oidc-context").then((mod) => mod.OidcSecure)
  );

  const { t } = useTranslation();

  const applications = useApiData(getApplications, {}, (apps) =>
    groupBy(
      apps.filter((app) => app.status !== "cancelled"),
      (a) => getReducedApplicationStatus(a.status)
    )
  );

  const rounds = useApiData(getApplicationRounds, {}, (applicationRounds) =>
    applicationRounds.reduce((prev, current) => {
      return { ...prev, [current.id]: current };
    }, {} as { [key: number]: ApplicationRound })
  );

  if (!isBrowser) {
    return null;
  }

  return (
    <OidcSecure>
      <>
        <Head heading={t("applications:heading")} />
        <Container>
          <Loader datas={[applications, rounds]}>
            <ApplicationGroups
              t={t}
              rounds={rounds.transformed || {}}
              applications={applications.transformed || {}}
            />
          </Loader>
        </Container>
      </>
    </OidcSecure>
  );
};

export default Applications;
