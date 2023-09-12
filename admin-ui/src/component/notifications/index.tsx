import React from "react";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { type TFunction } from "i18next";
import { BANNER_NOTIFICATIONS_ADMIN_LIST } from "common/src/components/BannerNotificationsQuery";
import type { Query, BannerNotificationType } from "common/types/gql-types";
import { Container } from "app/styles/layout";
import BreadcrumbWrapper from "app/component/BreadcrumbWrapper";
import Loader from "app/component/Loader";
import { CustomTable, DataOrMessage, TableLink } from "../lists/components";
import { valueForDateInput } from "../ReservationUnits/ReservationUnitEditor/DateTimeInput";
import { Link } from "react-router-dom";
import { Button } from "hds-react";

const notificationUrl = (pk: number) => `/messaging/notifications/${pk}`;

// Tila, Nimi, Voimassa alk, Voimassa asti, Kohderyhmä, Tyyppi
const getColConfig = (t: TFunction) => [
  {
    headerName: t("Notifications.headings.state"),
    key: "state",
    isSortable: false,
    transform: (notification: NonNullable<BannerNotificationType>) =>
      t(`Notifications.state.${notification.state ?? "noState"}`),
  },
  {
    headerName: t("Notifications.headings.name"),
    key: "name",
    isSortable: false,
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
    isSortable: false,
    transform: (notification: NonNullable<BannerNotificationType>) =>
      // TODO should have time also (not just the date)
      notification.activeFrom
        ? valueForDateInput(notification.activeFrom)
        : "-",
  },
  {
    headerName: t("Notifications.headings.activeUntil"),
    key: "activeUntil",
    isSortable: false,
    transform: (notification: NonNullable<BannerNotificationType>) =>
      // TODO should have time also (not just the date)
      notification.activeUntil
        ? valueForDateInput(notification.activeUntil)
        : "-",
  },
  {
    headerName: t("Notifications.headings.targetGroup"),
    key: "targetGroup",
    isSortable: false,
    transform: (notification: NonNullable<BannerNotificationType>) =>
      t(`Notifications.target.${notification.target ?? "noTarget"}`),
  },
  {
    headerName: t("Notifications.headings.level"),
    key: "level",
    isSortable: false,
    transform: (notification: NonNullable<BannerNotificationType>) =>
      t(`Notifications.level.${notification.level ?? "noLevel"}`),
  },
];

const NotificationsTable = ({
  notifications,
}: {
  notifications: BannerNotificationType[];
}) => {
  const { t } = useTranslation();
  const cols = getColConfig(t);

  // TODO sort
  const onSortChanged = () => {
    console.warn("TODO: implement sorting");
  };

  console.log("notifications", notifications);
  return (
    <DataOrMessage
      filteredData={notifications}
      noFilteredData={t("Notifications.noNotifications")}
    >
      <CustomTable
        setSort={onSortChanged}
        indexKey="pk"
        rows={notifications}
        cols={cols}
        /*
        initialSortingColumnKey={sort === undefined ? undefined : sort.field}
        initialSortingOrder={
          sort === undefined ? undefined : (sort.asc && "asc") || "desc"
        }
        */
      />
    </DataOrMessage>
  );
};

/// @brief this is the listing page for all notifications.
const Page = () => {
  const { data, loading: isLoading } = useQuery<Query>(
    BANNER_NOTIFICATIONS_ADMIN_LIST
  );

  const notifications =
    data?.bannerNotifications?.edges
      .map((edge) => edge?.node)
      .filter((n): n is BannerNotificationType => n != null) ?? [];

  const { t } = useTranslation();

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>{t("Notifications.pageTitle")}</h1>
        {/* TODO dont use nested button / lint use something like ButtonLikeLink but it needs primary variant */}
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
        <NotificationsTable notifications={notifications} />
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
