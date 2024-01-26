import React, { useState } from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useQuery } from "@apollo/client";
import { Notification } from "hds-react";
import { useTranslation } from "next-i18next";
import { Dictionary, groupBy } from "lodash";
import styled from "styled-components";
import { ReducedApplicationStatus } from "common/types/common";
import {
  ApplicationNode,
  ApplicationStatusChoice,
  Query,
  QueryApplicationsArgs,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { useSession } from "@/hooks/auth";
import { getReducedApplicationStatus } from "@/modules/util";
import Head from "@/components/applications/Head";
import ApplicationsGroup from "@/components/applications/ApplicationsGroup";
import { CenterSpinner } from "@/components/common/common";
import { APPLICATIONS } from "@/modules/queries/application";
import { getCommonServerSideProps } from "@/modules/serverUtils";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale } = ctx;

  return {
    props: {
      ...getCommonServerSideProps(),
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
`;

const statusGroupOrder: ReducedApplicationStatus[] = [
  "sent",
  "processing",
  "draft",
];

const ApplicationGroups = ({
  applications,
  actionCallback,
}: {
  applications: { [key: string]: ApplicationNode[] };
  actionCallback: (string: "error" | "cancel") => Promise<void>;
}) => {
  const { t } = useTranslation();
  if (Object.keys(applications).length === 0) {
    return <span>{t("applications:noApplications")}</span>;
  }
  return (
    <>
      {statusGroupOrder.map((gr) => (
        <ApplicationsGroup
          key={gr}
          name={t(`applications:group.${gr}`)}
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
    data: appData,
    error: isError,
    loading: isLoading,
    refetch,
  } = useQuery<Query, QueryApplicationsArgs>(APPLICATIONS, {
    fetchPolicy: "no-cache",
    skip: !user?.pk,
    variables: {
      applicant: user?.pk,
      status: [
        ApplicationStatusChoice.Draft,
        ApplicationStatusChoice.ResultsSent,
        ApplicationStatusChoice.InAllocation,
        ApplicationStatusChoice.Handled,
        ApplicationStatusChoice.Received,
      ],
    },
  });

  const appNodes = filterNonNullable(
    appData?.applications?.edges?.map((n) => n?.node)
  );
  const applications: Dictionary<ApplicationNode[]> = groupBy(appNodes, (a) =>
    getReducedApplicationStatus(a?.status ?? undefined)
  );

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
