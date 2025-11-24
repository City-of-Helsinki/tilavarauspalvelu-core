import React, { useEffect, useState } from "react";
import { gql, useApolloClient } from "@apollo/client";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import type { TFunction } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { BannerNotificationStatusLabel } from "ui/src/components/statuses";
import { formatDate, formatTime } from "ui/src/modules/date-utils";
import { filterNonNullable } from "ui/src/modules/helpers";
import { CenterSpinner, TitleSection, H1 } from "ui/src/styled";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { ButtonLikeLink } from "@/components/ButtonLikeLink";
import { More } from "@/components/More";
import { CustomTable } from "@/components/Table";
import { createClient } from "@/modules/apolloClient";
import { GQL_MAX_RESULTS_PER_QUERY } from "@/modules/const";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { getNotificationListUrl, getNotificationUrl } from "@/modules/urls";
import { TableLink } from "@/styled";
import {
  BannerNotificationOrderingChoices,
  UserPermissionChoice,
  BannerNotificationsListDocument,
  useBannerNotificationsListQuery,
} from "@gql/gql-types";
import type {
  BannerNotificationTableElementFragment,
  BannerNotificationsListQueryVariables,
  BannerNotificationsListQuery,
} from "@gql/gql-types";

// Tila, Nimi, Voimassa alk, Voimassa asti, Kohderyhmä, Tyyppi
const getColConfig = (t: TFunction) => [
  {
    headerName: t("notification:headings.state"),
    key: "state",
    isSortable: true,
    transform: ({ state }: BannerNotificationTableElementFragment) => <BannerNotificationStatusLabel state={state} />,
  },
  {
    headerName: t("notification:headings.name"),
    key: "name",
    isSortable: true,
    transform: (notification: BannerNotificationTableElementFragment) =>
      notification.pk ? (
        <TableLink href={getNotificationUrl(notification.pk)}>{notification.name}</TableLink>
      ) : (
        notification.name
      ),
  },
  {
    headerName: t("notification:headings.activeFrom"),
    key: "starts",
    isSortable: true,
    transform: (notification: BannerNotificationTableElementFragment) =>
      notification.activeFrom
        ? `${formatDate(new Date(notification.activeFrom))} ${formatTime(new Date(notification.activeFrom))}`
        : "-",
  },
  {
    headerName: t("notification:headings.activeUntil"),
    key: "ends",
    isSortable: true,
    transform: (notification: BannerNotificationTableElementFragment) =>
      notification.activeUntil
        ? `${formatDate(new Date(notification.activeUntil))} ${formatTime(new Date(notification.activeUntil))}`
        : "-",
  },
  {
    headerName: t("notification:headings.targetGroup"),
    key: "target",
    isSortable: true,
    transform: (notification: BannerNotificationTableElementFragment) =>
      t(`notification:target.${notification.target}`),
  },
  {
    headerName: t("notification:headings.level"),
    key: "level",
    isSortable: true,
    transform: (notification: BannerNotificationTableElementFragment) => t(`notification:level.${notification.level}`),
  },
];

function NotificationsTable({
  notifications,
  onSortChanged,
  sort,
  isLoading,
}: {
  notifications: BannerNotificationTableElementFragment[];
  onSortChanged: (key: string) => void;
  sort: string;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const cols = getColConfig(t);

  if (notifications.length === 0) {
    return <p>{t("notification:noNotifications")}</p>;
  }

  return (
    <CustomTable
      setSort={(sortBy) => onSortChanged(sortBy)}
      indexKey="pk"
      rows={notifications}
      cols={cols}
      initialSortingColumnKey={sort.startsWith("-") ? sort.slice(1) : sort}
      initialSortingOrder={sort.startsWith("-") ? "desc" : "asc"}
      isLoading={isLoading}
    />
  );
}

/// @brief this is the listing page for all notifications.
function Notifications({ notifications: notificationsOriginal }: PageProps) {
  // TODO the default sort should be ["state", "-ends"] but the frontend sort doesn't support multiple options
  // so either leave it with just state or do some custom magic for the initial sort
  const [sort, setSort] = useState<string>("state");
  const orderBy = transformSortString(sort);

  const { data, loading, previousData, fetchMore } = useBannerNotificationsListQuery({
    variables: {
      first: GQL_MAX_RESULTS_PER_QUERY,
      orderBy,
    },
    fetchPolicy: "cache-and-network",
  });

  const { bannerNotifications } = data ?? previousData ?? notificationsOriginal;
  const notifications = filterNonNullable(bannerNotifications?.edges?.map((edge) => edge?.node));

  const { t } = useTranslation();

  const handleSortChange = (sortField: string) => {
    if (sort === sortField) {
      setSort(`-${sortField}`);
    } else {
      setSort(sortField);
    }
  };

  return (
    <>
      <TitleSection>
        <div>
          <H1 $marginTop="none">{t("notification:pageTitle")}</H1>
          <p style={{ maxWidth: "var(--prose-width)" }}>{t("notification:pageDescription")}</p>
        </div>
        <ButtonLikeLink variant="primary" size="large" href={`${getNotificationListUrl()}/new`}>
          {t("notification:newNotification")}
        </ButtonLikeLink>
      </TitleSection>
      {loading && notifications.length === 0 ? (
        <CenterSpinner />
      ) : (
        <>
          <NotificationsTable
            notifications={notifications}
            onSortChanged={handleSortChange}
            sort={sort}
            isLoading={loading}
          />
          <More
            totalCount={data?.bannerNotifications?.totalCount ?? 0}
            pageInfo={data?.bannerNotifications?.pageInfo}
            count={notifications.length}
            fetchMore={(after) => fetchMore({ variables: { after } })}
          />
        </>
      )}
    </>
  );
}

function transformOrderBy(orderBy: string, desc: boolean): BannerNotificationOrderingChoices | null {
  switch (orderBy) {
    case "pk":
      return desc ? BannerNotificationOrderingChoices.PkDesc : BannerNotificationOrderingChoices.PkAsc;
    case "state":
      return desc ? BannerNotificationOrderingChoices.StateDesc : BannerNotificationOrderingChoices.StateAsc;
    case "name":
      return desc ? BannerNotificationOrderingChoices.NameDesc : BannerNotificationOrderingChoices.NameAsc;
    case "starts":
      return desc ? BannerNotificationOrderingChoices.StartsDesc : BannerNotificationOrderingChoices.StartsAsc;
    case "ends":
      return desc ? BannerNotificationOrderingChoices.EndsDesc : BannerNotificationOrderingChoices.EndsAsc;
    case "target":
      return desc ? BannerNotificationOrderingChoices.TargetDesc : BannerNotificationOrderingChoices.TargetAsc;
    case "level":
      return desc ? BannerNotificationOrderingChoices.LevelDesc : BannerNotificationOrderingChoices.LevelAsc;
    default:
      return null;
  }
}

function transformSortString(sort: string | null): BannerNotificationOrderingChoices[] {
  if (!sort) {
    return [BannerNotificationOrderingChoices.StateDesc];
  }
  const desc = sort.startsWith("-");
  const sortKey = desc ? sort.slice(1) : sort;
  const orderBy = transformOrderBy(sortKey, desc);
  return orderBy ? [orderBy] : [BannerNotificationOrderingChoices.StateDesc];
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function ApplicationRoundRouted(props: PageProps): JSX.Element {
  // Manually cache SSR query so we get proper pagination and sorting
  // while still maintaining full initial page loads
  // useEffect causes the page to redraw, so we pass the data to the Page component also
  const apolloClient = useApolloClient();
  useEffect(() => {
    apolloClient.writeQuery({
      query: BannerNotificationsListDocument,
      data: {
        notifications: props.notifications,
      },
    });
  }, [apolloClient, props]);
  return (
    <AuthorizationChecker permission={UserPermissionChoice.CanManageNotifications}>
      <Notifications {...props} />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale, req }: GetServerSidePropsContext) {
  const { apiBaseUrl } = await getCommonServerSideProps();
  const apolloClient = createClient(apiBaseUrl, req);
  const notifications = await apolloClient.query<BannerNotificationsListQuery, BannerNotificationsListQueryVariables>({
    query: BannerNotificationsListDocument,
  });
  return {
    props: {
      notifications: notifications.data,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export const BANNER_NOTIFICATIONS_TABLE_ELEMENT_FRAGMENT = gql`
  fragment BannerNotificationTableElement on BannerNotificationNode {
    id
    pk
    name
    activeFrom
    activeUntil
    state
    target
    level
  }
`;

// TODO reduce the size of the query (use a different fragment or no fragment at all)
export const BANNER_NOTIFICATION_LIST_QUERY = gql`
  query BannerNotificationsList($first: Int, $after: String, $orderBy: [BannerNotificationOrderingChoices]) {
    bannerNotifications(first: $first, after: $after, orderBy: $orderBy) {
      edges {
        node {
          ...BannerNotificationTableElement
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;
