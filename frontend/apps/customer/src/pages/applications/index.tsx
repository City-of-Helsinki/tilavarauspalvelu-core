import React from "react";
import { gql } from "@apollo/client";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { errorToast, successToast } from "ui/src/components/toast";
import { filterNonNullable } from "ui/src/modules/helpers";
import { H1 } from "ui/src/styled";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useCurrentUser } from "@/hooks";
import { ApplicationsGroup } from "@/lib/applications";
import { createApolloClient } from "@/modules/apolloClient";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import {
  ApplicationStatusChoice,
  type ApplicationsQuery,
  useApplicationsLazyQuery,
  ApplicationsDocument,
  type ApplicationsQueryVariables,
  CurrentUserDocument,
  type CurrentUserQuery,
  ApplicationOrderingChoices,
} from "@gql/gql-types";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

const VALID_STATUSES = [
  ApplicationStatusChoice.Draft,
  ApplicationStatusChoice.ResultsSent,
  ApplicationStatusChoice.InAllocation,
  ApplicationStatusChoice.Handled,
  ApplicationStatusChoice.Received,
];

function ApplicationGroups({
  applications,
  actionCallback,
}: {
  applications: NonNullable<NonNullable<NonNullable<ApplicationsQuery["applications"]>["edges"][0]>["node"]>[];
  actionCallback: (string: "error" | "cancel") => Promise<void>;
}) {
  const { t } = useTranslation();
  if (applications.length === 0) {
    return <span>{t("applications:noApplications")}</span>;
  }

  const sent = applications.filter((a) => a.status === ApplicationStatusChoice.ResultsSent);
  const received = applications.filter((a) => a.status === ApplicationStatusChoice.Received);
  const processing = applications.filter(
    (a) => a.status === ApplicationStatusChoice.InAllocation || a.status === ApplicationStatusChoice.Handled
  );
  const draft = applications.filter(
    (a) =>
      a.status === ApplicationStatusChoice.Draft ||
      a.status === ApplicationStatusChoice.Cancelled ||
      a.status === ApplicationStatusChoice.Expired
  );

  return (
    <>
      <ApplicationsGroup name={t(`applications:group.sent`)} applications={sent} actionCallback={actionCallback} />
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
      <ApplicationsGroup name={t(`applications:group.draft`)} applications={draft} actionCallback={actionCallback} />
    </>
  );
}

function ApplicationsPage({ data: initialData }: PropsNarrowed): JSX.Element | null {
  const { t } = useTranslation();

  const { currentUser } = useCurrentUser();
  // Requires a client side query because we can do modifications without leaving the page
  // TODO better would be to hydrate the client and use refetch when modifying
  const [fetch, { data: appData }] = useApplicationsLazyQuery({
    fetchPolicy: "no-cache",
    variables: {
      user: currentUser?.pk ?? 0,
      status: VALID_STATUSES,
      orderBy: [ApplicationOrderingChoices.SentAtDesc],
    },
  });

  const data = appData ?? initialData;
  const applications = filterNonNullable(data.applications?.edges?.map((n) => n?.node));

  const actionCallback = async (type: "cancel" | "error") => {
    switch (type) {
      case "cancel":
        await fetch();
        successToast({ text: t("applicationCard:cancelled") });
        break;
      case "error":
        errorToast({ text: t("applicationCard:cancelFailed") });
        break;
      default:
    }
  };

  const routes = [
    {
      title: t("breadcrumb:applications"),
    },
  ] as const;

  return (
    <>
      <Breadcrumb routes={routes} />
      <div>
        <H1 $marginTop="none">{t("applications:heading")}</H1>
        <p>{t("applications:subHeading")}</p>
      </div>
      <ApplicationGroups applications={applications} actionCallback={actionCallback} />
    </>
  );
}

export default ApplicationsPage;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;

  const { apiBaseUrl } = getCommonServerSideProps();
  const client = createApolloClient(apiBaseUrl, ctx);

  // NOTE have to be done with double query because applications returns everything the user has access to (not what he owns)
  const { data: userData } = await client.query<CurrentUserQuery>({
    query: CurrentUserDocument,
  });

  const { currentUser: user } = userData;

  if (!user?.pk) {
    return {
      notFound: true,
      props: {
        notFound: true,
        ...(await serverSideTranslations(locale ?? "fi")),
      },
    };
  }

  const { data: appData } = await client.query<ApplicationsQuery, ApplicationsQueryVariables>({
    query: ApplicationsDocument,
    variables: {
      user: user.pk,
      status: VALID_STATUSES,
      orderBy: [ApplicationOrderingChoices.SentAtDesc],
    },
  });

  return {
    props: {
      data: appData,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

// NOTE because this doesn't have pagination we use orderBy for development purposes only
// if you create new application it's the first one in the list
export const APPLICATIONS = gql`
  query Applications($user: Int!, $status: [ApplicationStatusChoice]!, $orderBy: [ApplicationOrderingChoices]!) {
    applications(user: $user, status: $status, orderBy: $orderBy) {
      edges {
        node {
          ...ApplicationsGroup
        }
      }
    }
  }
`;
