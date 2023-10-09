import React, { useState } from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useQuery } from "@apollo/client";
import { Notification } from "hds-react";
import { useTranslation, TFunction } from "next-i18next";
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
import { useSession } from "@/hooks/auth";
import { getReducedApplicationStatus } from "@/modules/util";
import { redirectProtectedRoute } from "@/modules/protectedRoute";
import Head from "../components/applications/Head";
import ApplicationsGroup from "../components/applications/ApplicationsGroup";
import { CenterSpinner } from "../components/common/common";
import { APPLICATIONS } from "../modules/queries/application";
import { APPLICATION_ROUNDS } from "../modules/queries/applicationRound";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { locale } = ctx;

  const redirect = redirectProtectedRoute(ctx);
  if (redirect) {
    return redirect;
  }

  return {
    props: {
      overrideBackgroundColor: "var(--tilavaraus-gray)",
      ...(await serverSideTranslations(locale ?? "fi")),
    },
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

const ApplicationsPage = (): JSX.Element | null => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useSession();

  const [cancelled, setCancelled] = useState(false);
  const [cancelError, setCancelError] = useState(false);

  const {
    data: roundsData,
    error: roundsError,
    loading: isRoundsLoading,
  } = useQuery<Query, QueryApplicationRoundsArgs>(APPLICATION_ROUNDS);

  const rounds =
    roundsData?.applicationRounds?.edges
      ?.map((n) => n?.node)
      .filter((n): n is ApplicationRoundType => n != null)
      .reduce(
        (prev, current) =>
          current.pk != null ? { ...prev, [current.pk]: current } : prev,
        {} as { [key: number]: ApplicationRoundType }
      ) ?? [];

  const {
    data: appData,
    error: appError,
    loading: isAppLoading,
    refetch,
  } = useQuery<Query, QueryApplicationsArgs>(APPLICATIONS, {
    fetchPolicy: "no-cache",
    skip: !user?.pk,
    variables: {
      user: user?.pk?.toString(),
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

  const appNodes =
    appData?.applications?.edges
      ?.map((n) => n?.node)
      .filter((n): n is ApplicationType => n != null) ?? [];
  const applications: Dictionary<ApplicationType[]> = groupBy(appNodes, (a) =>
    getReducedApplicationStatus(a?.status ?? undefined)
  );

  const isLoading = isRoundsLoading || isAppLoading;
  const isError = roundsError || appError;

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

  // NOTE should never happen since we do an SSR redirect
  if (!isAuthenticated) {
    return <div>{t("common:error.notAuthenticated")}</div>;
  }

  return (
    <>
      <Head />
      <Container>
        {isLoading && <CenterSpinner />}
        {isError && (
          <Notification
            type="error"
            label={t("common:error.error")}
            position="top-center"
          >
            {t("common:error.dataError")}
          </Notification>
        )}
        {!isLoading && !isError ? (
          <ApplicationGroups
            t={t}
            rounds={rounds}
            applications={applications}
            actionCallback={actionCallback}
          />
        ) : null}
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
