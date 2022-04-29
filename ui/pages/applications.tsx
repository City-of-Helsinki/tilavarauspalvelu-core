import React, { useEffect, useState } from "react";
import { GetStaticProps } from "next";
import { Dictionary, groupBy } from "lodash";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Notification } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { TFunction } from "next-i18next";
import { getApplications, getCurrentUser } from "../modules/api";
import { Application, ReducedApplicationStatus, User } from "../modules/types";
import { getReducedApplicationStatus } from "../modules/util";
import Head from "../components/applications/Head";
import ApplicationsGroup from "../components/applications/ApplicationsGroup";
import RequireAuthentication from "../components/common/RequireAuthentication";
import { CenterSpinner } from "../components/common/common";
import apolloClient from "../modules/apolloClient";
import {
  ApplicationRoundType,
  Query,
  QueryApplicationRoundsArgs,
} from "../modules/gql-types";
import { APPLICATION_ROUNDS } from "../modules/queries/applicationRound";

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
  rounds: { [key: number]: ApplicationRoundType };
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
    useState<Dictionary<Application[]>>(null);
  const [rounds, setRounds] = useState(null);

  const [state, setState] = useState<"loading" | "error" | "done">("loading");

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (e) {
        setState("error");
      }
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
      const { data } = await apolloClient.query<
        Query,
        QueryApplicationRoundsArgs
      >({
        query: APPLICATION_ROUNDS,
      });
      const applicationRounds = data.applicationRounds?.edges?.map(
        (n) => n.node
      );
      setRounds(
        applicationRounds.reduce((prev, current) => {
          return { ...prev, [current.pk]: current };
        }, {} as { [key: number]: ApplicationRoundType })
      );
    };

    fetchRounds();
  }, [currentUser]);

  useEffect(() => {
    if (applications && rounds) {
      setState("done");
    }
  }, [applications, rounds]);

  return (
    <>
      <Head />
      <RequireAuthentication>
        <Container>
          {state === "done" ? (
            <ApplicationGroups
              t={t}
              rounds={rounds}
              applications={applications}
            />
          ) : state === "error" ? (
            <Notification
              type="error"
              label={t("common:error.error")}
              position="top-center"
            >
              {t("common:error.dataError")}
            </Notification>
          ) : (
            <CenterSpinner />
          )}
        </Container>
      </RequireAuthentication>
    </>
  );
};

export default Applications;
