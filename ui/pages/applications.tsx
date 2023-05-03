import React, { useEffect, useMemo, useState } from "react";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useQuery } from "@apollo/client";
import { Notification } from "hds-react";
import { useTranslation, TFunction } from "next-i18next";
import { signIn, useSession } from "next-auth/react";
import { Dictionary, groupBy } from "lodash";
import styled from "styled-components";
import { ReducedApplicationStatus } from "common/types/common";
import {
  ApplicationRoundType,
  ApplicationType,
  ApplicationStatus,
  Query,
  QueryApplicationRoundsArgs,
  QueryApplicationsArgs,
} from "common/types/gql-types";
import Head from "../components/applications/Head";
import ApplicationsGroup from "../components/applications/ApplicationsGroup";
import { CenterSpinner } from "../components/common/common";
import { APPLICATIONS } from "../modules/queries/application";
import { APPLICATION_ROUNDS } from "../modules/queries/applicationRound";
import { getReducedApplicationStatus } from "../modules/util";
import { CURRENT_USER } from "../modules/queries/user";
import { authEnabled, authenticationIssuer } from "../modules/const";

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
];

const ApplicationGroups = ({
  rounds,
  applications,
  actionCallback,
  t,
}: {
  rounds: { [key: number]: ApplicationRoundType };
  applications: { [key: string]: ApplicationType[] };
  actionCallback: (string: "error" | "cancel") => Promise<void>;
  t: TFunction;
}) => {
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
};

const ApplicationsPage = (): JSX.Element => {
  const { t } = useTranslation();
  const session = useSession();

  const isUserUnauthenticated =
    authEnabled && session?.status === "unauthenticated";

  useEffect(() => {
    if (isUserUnauthenticated) {
      signIn(authenticationIssuer, {
        callbackUrl: window.location.href,
      });
    }
  }, [isUserUnauthenticated]);

  const [state, setState] = useState<"loading" | "error" | "done">("loading");
  const [cancelled, setCancelled] = useState(false);
  const [cancelError, setCancelError] = useState(false);

  const { data: userData } = useQuery<Query>(CURRENT_USER, {
    fetchPolicy: "no-cache",
    onError: () => setState("error"),
  });

  const currentUser = useMemo(() => userData?.currentUser, [userData]);

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
    skip: !currentUser?.pk,
    variables: {
      user: currentUser?.pk?.toString(),
      status: [
        ApplicationStatus.Draft,
        ApplicationStatus.Sent,
        ApplicationStatus.InReview,
        ApplicationStatus.ReviewDone,
        ApplicationStatus.Allocated,
        ApplicationStatus.Handled,
        ApplicationStatus.Received,
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

  if (isUserUnauthenticated) return null;

  return (
    <>
      <Head />

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
    </>
  );
};

export default ApplicationsPage;
