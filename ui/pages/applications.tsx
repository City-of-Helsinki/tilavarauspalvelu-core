import React, { useEffect, useMemo, useState } from "react";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useQuery } from "@apollo/client";
import { Notification } from "hds-react";
import { useTranslation } from "react-i18next";
import { Dictionary, groupBy } from "lodash";
import styled from "styled-components";
import { TFunction } from "next-i18next";
import { getCurrentUser } from "../modules/api";
import { ReducedApplicationStatus, User } from "../modules/types";
import Head from "../components/applications/Head";
import ApplicationsGroup from "../components/applications/ApplicationsGroup";
import RequireAuthentication from "../components/common/RequireAuthentication";
import { CenterSpinner } from "../components/common/common";
import {
  ApplicationRoundType,
  ApplicationType,
  ApplicationStatus,
  Query,
  QueryApplicationRoundsArgs,
  QueryApplicationsArgs,
} from "../modules/gql-types";
import { APPLICATIONS } from "../modules/queries/application";
import { APPLICATION_ROUNDS } from "../modules/queries/applicationRound";
import { getReducedApplicationStatus } from "../modules/util";

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
  actionCallback,
  t,
}: {
  rounds: { [key: number]: ApplicationRoundType };
  applications: { [key: string]: ApplicationType[] };
  actionCallback: (string: "error" | "cancel") => Promise<void>;
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
          actionCallback={actionCallback}
        />
      ))}
    </>
  );
}

const Applications = (): JSX.Element => {
  const { t } = useTranslation();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [state, setState] = useState<"loading" | "error" | "done">("loading");
  const [cancelled, setCancelled] = useState(false);
  const [cancelError, setCancelError] = useState(false);

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

  const { data: roundsData, error: roundsError } = useQuery<
    Query,
    QueryApplicationRoundsArgs
  >(APPLICATION_ROUNDS);

  const rounds = useMemo(
    () =>
      roundsData?.applicationRounds?.edges
        ?.map((n) => n.node)
        .reduce(
          (prev, current) => ({ ...prev, [current.pk]: current }),
          {} as { [key: number]: ApplicationRoundType }
        ),
    [roundsData]
  );

  const {
    data: appData,
    error: appError,
    refetch,
  } = useQuery<Query, QueryApplicationsArgs>(APPLICATIONS, {
    fetchPolicy: "no-cache",
    skip: !currentUser?.id,
    variables: {
      user: currentUser?.id?.toString(),
      status: [
        ApplicationStatus.Declined,
        ApplicationStatus.Draft,
        ApplicationStatus.Sent,
        ApplicationStatus.InReview,
        ApplicationStatus.ReviewDone,
      ],
    },
  });

  const applications: Dictionary<ApplicationType[]> = useMemo(
    () =>
      groupBy(
        appData?.applications?.edges?.map((n) => n.node),
        (a) => getReducedApplicationStatus(a.status)
      ),
    [appData]
  );

  useEffect(() => {
    if (roundsError || appError) {
      setState("error");
    }
  }, [roundsError, appError]);

  useEffect(() => {
    if (
      appData?.applications?.edges &&
      rounds &&
      Object.keys(rounds).length > 0
    ) {
      setState("done");
    }
  }, [appData, applications, rounds]);

  const actionCallback = async (type: "cancel" | "error") => {
    switch (type) {
      case "cancel":
        await refetch();
        setCancelled(true);
        break;
      case "error":
        setCancelError(true);
        break;
      default:
    }
  };

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
              actionCallback={actionCallback}
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
            state === "loading" && <CenterSpinner />
          )}
        </Container>
        {cancelled && (
          <Notification
            type="success"
            position="top-center"
            dismissible
            autoClose
            onClose={() => setCancelled(false)}
            closeButtonLabelText={t("common:close")}
            displayAutoCloseProgress={false}
          >
            {t("applicationCard:cancelled")}
          </Notification>
        )}
        {cancelError && (
          <Notification
            type="error"
            position="top-center"
            dismissible
            autoClose
            onClose={() => setCancelError(false)}
            closeButtonLabelText={t("common:close")}
            displayAutoCloseProgress={false}
          >
            {t("applicationCard:cancelFailed")}
          </Notification>
        )}
      </RequireAuthentication>
    </>
  );
};

export default Applications;
