import React, { useState } from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Notification } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import {
  ApplicationStatusChoice,
  type ApplicationsQuery,
  useApplicationsLazyQuery,
  ApplicationsDocument,
  type ApplicationsQueryVariables,
  GetCurrentUserDocument,
  type GetCurrentUserQuery,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import Head from "@/components/applications/Head";
import ApplicationsGroup from "@/components/applications/ApplicationsGroup";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import { useCurrentUser } from "@/hooks/user";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

const VALID_STATUSES = [
  ApplicationStatusChoice.Draft,
  ApplicationStatusChoice.ResultsSent,
  ApplicationStatusChoice.InAllocation,
  ApplicationStatusChoice.Handled,
  ApplicationStatusChoice.Received,
];

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;

  const commonProps = getCommonServerSideProps();
  const client = createApolloClient(commonProps.apiBaseUrl, ctx);

  const { data: userData } = await client.query<GetCurrentUserQuery>({
    query: GetCurrentUserDocument,
  });

  const { currentUser: user } = userData;

  if (!user?.pk) {
    return {
      notFound: true,
      props: {
        ...commonProps,
        ...(await serverSideTranslations(locale ?? "fi")),
        notFound: true,
      },
    };
  }

  const { data: appData } = await client.query<
    ApplicationsQuery,
    ApplicationsQueryVariables
  >({
    query: ApplicationsDocument,
    fetchPolicy: "no-cache",
    variables: {
      user: user.pk,
      status: VALID_STATUSES,
    },
  });

  return {
    props: {
      ...getCommonServerSideProps(),
      overrideBackgroundColor: "var(--tilavaraus-gray)",
      ...(await serverSideTranslations(locale ?? "fi")),
      data: appData,
    },
  };
}

const Container = styled.div`
  padding: 0 var(--spacing-m) var(--spacing-m);
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  font-size: var(--fontsize-body-xl);
`;

function ApplicationGroups({
  applications,
  actionCallback,
}: {
  applications: NonNullable<
    NonNullable<
      NonNullable<ApplicationsQuery["applications"]>["edges"][0]
    >["node"]
  >[];
  actionCallback: (string: "error" | "cancel") => Promise<void>;
}) {
  const { t } = useTranslation();
  if (Object.keys(applications).length === 0) {
    return <span>{t("applications:noApplications")}</span>;
  }

  const sent = applications.filter(
    (a) => a.status === ApplicationStatusChoice.ResultsSent
  );
  const received = applications.filter(
    (a) => a.status === ApplicationStatusChoice.Received
  );
  const processing = applications.filter(
    (a) =>
      a.status === ApplicationStatusChoice.InAllocation ||
      a.status === ApplicationStatusChoice.Handled
  );
  const draft = applications.filter(
    (a) =>
      a.status === ApplicationStatusChoice.Draft ||
      a.status === ApplicationStatusChoice.Cancelled ||
      a.status === ApplicationStatusChoice.Expired
  );

  return (
    <>
      <ApplicationsGroup
        name={t(`applications:group.sent`)}
        applications={sent}
        actionCallback={actionCallback}
      />
      <ApplicationsGroup
        name={t(`applications:group.received`)}
        applications={received}
        actionCallback={actionCallback}
      />
      <ApplicationsGroup
        name={t(`applications:group.processing`)}
        applications={processing}
        actionCallback={actionCallback}
      />
      <ApplicationsGroup
        name={t(`applications:group.draft`)}
        applications={draft}
        actionCallback={actionCallback}
      />
    </>
  );
}

function ApplicationsPage({
  data: initialData,
}: PropsNarrowed): JSX.Element | null {
  const { t } = useTranslation();
  const [cancelled, setCancelled] = useState(false);
  const [cancelError, setCancelError] = useState(false);

  const { currentUser } = useCurrentUser();
  // Requires a client side query because we can do modifications without leaving the page
  // TODO better would be to hydrate the client and use refetch when modifying
  const [fetch, { data: appData }] = useApplicationsLazyQuery({
    fetchPolicy: "no-cache",
    variables: {
      user: currentUser?.pk ?? 0,
      status: VALID_STATUSES,
    },
  });

  const data = appData ?? initialData;
  const applications = filterNonNullable(
    data.applications?.edges?.map((n) => n?.node)
  );

  const actionCallback = async (type: "cancel" | "error") => {
    switch (type) {
      case "cancel":
        await fetch();
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
      <Container>
        <ApplicationGroups
          applications={applications}
          actionCallback={actionCallback}
        />
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
}

export default ApplicationsPage;
