import React, { useEffect, useState } from "react";
import { GetStaticProps } from "next";
import { Dictionary, groupBy } from "lodash";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { TFunction } from "next-i18next";
import {
  getApplicationRounds,
  getApplications,
  getCurrentUser,
} from "../modules/api";
import {
  Application,
  ApplicationRound,
  ReducedApplicationStatus,
  User,
} from "../modules/types";
import { getReducedApplicationStatus } from "../modules/util";
import Head from "../components/applications/Head";
import ApplicationsGroup from "../components/applications/ApplicationsGroup";
import RequireAuthentication from "../components/common/RequireAuthentication";
import { CenterSpinner } from "../components/common/common";

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      overrideBackgroundColor: "var(--tilavaraus-gray)",
      ...(await serverSideTranslations(locale)),
    },
    revalidate: 100, // In seconds
  };
};

const Container = styled.div`
  padding: 0 var(--spacing-m) var(--spacing-m);
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
  const { t } = useTranslation();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [applications, setApplications] =
    useState<Dictionary<[Application, ...Application[]]>>(null);
  const [rounds, setRounds] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };

    if (currentUser === null) {
      fetchCurrentUser();
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchApplications = async () => {
      const apps = await getApplications(currentUser.id);
      const filteredApps = groupBy(
        apps.filter((app) => app.status !== "cancelled"),
        (a) => getReducedApplicationStatus(a.status)
      );
      setApplications(filteredApps);
    };

    if (currentUser?.id) {
      fetchApplications();
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchRounds = async () => {
      const data = await getApplicationRounds();
      setRounds(
        data.reduce((prev, current) => {
          return { ...prev, [current.id]: current };
        }, {} as { [key: number]: ApplicationRound })
      );
    };

    fetchRounds();
  }, []);

  return (
    <>
      <Head />
      <RequireAuthentication>
        <Container>
          {applications && rounds ? (
            <ApplicationGroups
              t={t}
              rounds={rounds}
              applications={applications}
            />
          ) : (
            <CenterSpinner />
          )}
        </Container>
      </RequireAuthentication>
    </>
  );
};

export default Applications;
