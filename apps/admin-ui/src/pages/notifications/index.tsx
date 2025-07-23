import React, { useState } from "react";
import { type TFunction, useTranslation } from "next-i18next";
import {
  BannerNotificationOrderingChoices,
  type BannerNotificationTableElementFragment,
  BannerNotificationState,
  useBannerNotificationListQuery,
  UserPermissionChoice,
} from "@gql/gql-types";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { valueForDateInput, valueForTimeInput } from "@/helpers";
import { GQL_MAX_RESULTS_PER_QUERY } from "@/common/const";
import { CustomTable } from "@/component/Table";
import { filterNonNullable } from "common/src/helpers";
import { More } from "@/component/More";
import { TableLink } from "@/styled";
import type { StatusLabelType } from "common/src/tags";
import StatusLabel from "common/src/components/StatusLabel";
import { IconCheck, IconClock, IconPen, IconQuestionCircleFill } from "hds-react";
import { getNotificationListUrl, getNotificationUrl } from "@/common/urls";
import { CenterSpinner, TitleSection, H1 } from "common/styled";
import { gql } from "@apollo/client";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { AuthorizationChecker } from "@/component/AuthorizationChecker";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetServerSidePropsContext } from "next";

const getStatusLabelProps = (
  state: BannerNotificationState | null | undefined
): { type: StatusLabelType; icon: JSX.Element } => {
  switch (state) {
    case BannerNotificationState.Draft:
      return { type: "draft", icon: <IconPen /> };
    case BannerNotificationState.Scheduled:
      return { type: "info", icon: <IconClock /> };
    case BannerNotificationState.Active:
      return { type: "success", icon: <IconCheck /> };
    default:
      return {
        type: "info",
        icon: <IconQuestionCircleFill />,
      };
  }
};

// Tila, Nimi, Voimassa alk, Voimassa asti, Kohderyhmä, Tyyppi
const getColConfig = (t: TFunction) => [
  {
    headerName: t("notification:headings.state"),
    key: "state",
    isSortable: true,
    transform: (notification: BannerNotificationTableElementFragment) => {
      const labelProps = getStatusLabelProps(notification.state);
      return (
        <StatusLabel type={labelProps.type} icon={labelProps.icon} slim>
          {t(`notification:state.${notification.state ?? "noState"}`)}
        </StatusLabel>
      );
    },
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
        ? `${valueForDateInput(notification.activeFrom)} ${valueForTimeInput(notification.activeFrom)}`
        : "-",
  },
  {
    headerName: t("notification:headings.activeUntil"),
    key: "ends",
    isSortable: true,
    transform: (notification: BannerNotificationTableElementFragment) =>
      notification.activeUntil
        ? `${valueForDateInput(notification.activeUntil)} ${valueForTimeInput(notification.activeUntil)}`
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
function Notifications() {
  // TODO the default sort should be ["state", "-ends"] but the frontend sort doesn't support multiple options
  // so either leave it with just state or do some custom magic for the initial sort
  const [sort, setSort] = useState<string>("state");
  const orderBy = transformSortString(sort);

  const { data, loading, previousData, fetchMore } = useBannerNotificationListQuery({
    variables: {
      first: GQL_MAX_RESULTS_PER_QUERY,
      orderBy,
    },
    fetchPolicy: "cache-and-network",
  });

  const { bannerNotifications } = data ?? previousData ?? {};
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
          <H1 $noMargin>{t("notification:pageTitle")}</H1>
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
  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl} permission={UserPermissionChoice.CanManageNotifications}>
      <Notifications />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(await getCommonServerSideProps()),
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
  query BannerNotificationList($first: Int, $after: String, $orderBy: [BannerNotificationOrderingChoices]) {
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
