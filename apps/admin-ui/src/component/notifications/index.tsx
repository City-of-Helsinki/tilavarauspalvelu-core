import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { type TFunction } from "i18next";
import { Link } from "react-router-dom";
import { Button } from "hds-react";
import { BANNER_NOTIFICATIONS_ADMIN_LIST } from "common/src/components/BannerNotificationsQuery";
import type { Query, BannerNotificationType } from "common/types/gql-types";
import { Container } from "app/styles/layout";
import BreadcrumbWrapper from "app/component/BreadcrumbWrapper";
import Loader from "app/component/Loader";
import { valueForDateInput, valueForTimeInput } from "app/helpers";
import { GQL_MAX_RESULTS_PER_QUERY } from "app/common/const";
import { CustomTable, TableLink } from "../lists/components";

const notificationUrl = (pk: number) => `/messaging/notifications/${pk}`;

// Tila, Nimi, Voimassa alk, Voimassa asti, Kohderyhmä, Tyyppi
const getColConfig = (t: TFunction) => [
  {
    headerName: t("Notifications.headings.state"),
    key: "state",
    isSortable: true,
    transform: (notification: NonNullable<BannerNotificationType>) =>
      t(`Notifications.state.${notification.state ?? "noState"}`),
  },
  {
    headerName: t("Notifications.headings.name"),
    key: "name",
    isSortable: true,
    transform: (notification: NonNullable<BannerNotificationType>) =>
      notification.pk != null ? (
        <TableLink href={notificationUrl(notification.pk)}>
          {notification.name ?? t("Notifications.noName")}
        </TableLink>
      ) : (
        notification.name ?? t("Notifications.noName")
      ),
  },
  {
    headerName: t("Notifications.headings.activeFrom"),
    key: "activeFrom",
    isSortable: true,
    transform: (notification: NonNullable<BannerNotificationType>) =>
      notification.activeFrom
        ? `${valueForDateInput(notification.activeFrom)} ${valueForTimeInput(
            notification.activeFrom
          )}`
        : "-",
  },
  {
    headerName: t("Notifications.headings.activeUntil"),
    key: "activeUntil",
    isSortable: true,
    transform: (notification: NonNullable<BannerNotificationType>) =>
      notification.activeUntil
        ? `${valueForDateInput(notification.activeUntil)} ${valueForTimeInput(
            notification.activeUntil
          )}`
        : "-",
  },
  {
    headerName: t("Notifications.headings.targetGroup"),
    key: "targetGroup",
    isSortable: true,
    transform: (notification: NonNullable<BannerNotificationType>) =>
      t(`Notifications.target.${notification.target ?? "noTarget"}`),
  },
  {
    headerName: t("Notifications.headings.level"),
    key: "level",
    isSortable: true,
    transform: (notification: NonNullable<BannerNotificationType>) =>
      t(`Notifications.level.${notification.level ?? "noLevel"}`),
  },
];

type Sort = {
  field: string;
  order: "asc" | "desc";
};

// Transform the one sort key to the format that the table component expects
// TODO proper way of doing this is to remap the Table sort keys in the ColConfig
// so allow different index keys and sort keys for a column (requires refactoring Table).
const transformSortKey = (key: string) => {
  if (key === "targetGroup") {
    return "target";
  }
  if (key === "activeFrom") {
    return "starts";
  }
  if (key === "activeUntil") {
    return "ends";
  }
  return key;
};
const transformToTableKey = (key: string) => {
  if (key === "target") {
    return "targetGroup";
  }
  if (key === "starts") {
    return "activeFrom";
  }
  if (key === "ends") {
    return "activeUntil";
  }
  return key;
};

const NotificationsTable = ({
  notifications,
  onSortChanged,
  sortKey,
}: {
  notifications: BannerNotificationType[];
  onSortChanged: (key: string) => void;
  sortKey: Sort;
}) => {
  const { t } = useTranslation();
  const cols = getColConfig(t);

  if (notifications.length === 0) {
    return <p>{t("Notifications.noNotifications")}</p>;
  }

  return (
    <CustomTable
      setSort={(sortBy) => onSortChanged(transformSortKey(sortBy))}
      indexKey="pk"
      rows={notifications}
      cols={cols}
      initialSortingColumnKey={transformToTableKey(sortKey.field)}
      initialSortingOrder={sortKey.order}
    />
  );
};

/// @brief this is the listing page for all notifications.
const Page = () => {
  // TODO the default sort should be ["state", "-ends"] but the frontend sort doesn't support multiple options
  // so either leave it with just state or do some custom magic for the initial sort
  const [sortKey, setSortKey] = useState<Sort>({
    field: "state",
    order: "asc" as const,
  });

  const {
    data,
    loading: isLoading,
    fetchMore,
  } = useQuery<Query>(BANNER_NOTIFICATIONS_ADMIN_LIST, {
    variables: {
      first: GQL_MAX_RESULTS_PER_QUERY,
      offset: 0,
      orderBy: `${sortKey.order === "desc" ? "-" : ""}${sortKey.field}`,
    },
  });

  const notifications =
    data?.bannerNotifications?.edges
      .map((edge) => edge?.node)
      .filter((n): n is BannerNotificationType => n != null) ?? [];
  const totalCount = data?.bannerNotifications?.totalCount ?? 0;

  const { t } = useTranslation();

  const handleSortChange = (key: string) => {
    if (sortKey.field === key && sortKey.order === "asc") {
      setSortKey({ field: key, order: "desc" });
    } else {
      setSortKey({ field: key, order: "asc" });
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>{t("Notifications.pageTitle")}</h1>
        {/* TODO dont use nested button / link use something like ButtonLikeLink but it needs primary variant */}
        <Link to="/messaging/notifications/new">
          <Button variant="primary">
            {t("Notifications.newNotification")}
          </Button>
        </Link>
      </div>
      <p>{t("Notifications.pageDescription")}</p>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <NotificationsTable
            notifications={notifications}
            onSortChanged={handleSortChange}
            sortKey={sortKey}
          />
          {totalCount > notifications.length && (
            <Button
              variant="secondary"
              onClick={() => {
                fetchMore({
                  variables: {
                    offset: notifications.length + 1,
                  },
                });
              }}
            >
              {t("Notifications.loadMore")}
            </Button>
          )}
        </>
      )}
    </>
  );
};

// We don't have proper layouts yet, so just separate the container stuff here
const PageWrapped = () => (
  <>
    <BreadcrumbWrapper route={["messaging", "notifications"]} />
    <Container>
      <Page />
    </Container>
  </>
);

export default PageWrapped;
