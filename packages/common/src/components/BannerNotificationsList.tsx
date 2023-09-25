import React from "react";
import { NotificationType } from "hds-react";
import styled from "styled-components";
import { useLocalStorage } from "react-use";
import { useQuery } from "@apollo/client";
import { t } from "i18next";
import NotificationWrapper from "./NotificationWrapper";
import { getTranslation } from "../common/util";
import { breakpoints } from "../common/style";
import { BannerNotificationType, Query } from "../../types/gql-types";
import { BANNER_NOTIFICATIONS_LIST } from "./BannerNotificationsQuery";

type BannerNotificationListProps = {
  displayAmount?: number;
  centered?: boolean;
};

type BannerNotificationItemProps = {
  notification: BannerNotificationType;
  closeFn: React.Dispatch<React.SetStateAction<string[] | undefined>>;
  closedArray: string[];
  centered?: boolean;
};

const PositionWrapper = styled.div`
  width: 100%;
  display: grid;
`;

const BannerNotificationBackground = styled.div`
  position: relative;
  display: flex;
  section {
    border-bottom: 1px solid var(--notification-border-color);
    [class*="PageWrapper__Content"] & {
      padding-right: var(--spacing-2-xl);
    }
  }
  > div {
    width: 100%;
  }
`;

const BannerNotificationText = styled.span`
  font-size: var(--fontsize-body-m);
  p {
    display: inline;
  }
  a {
    text-decoration: underline;
  }
  @media (width < ${breakpoints.xl}) {
    padding-right: var(--spacing-l);
  }
`;

const NotificationsListItem = ({
  notification,
  closeFn,
  closedArray,
  centered,
}: BannerNotificationItemProps) => {
  let notificationType: NotificationType;
  switch (notification.level) {
    case "EXCEPTION":
      notificationType = "error";
      break;
    case "WARNING":
      notificationType = "alert";
      break;
    default:
      notificationType = "info";
  }
  return (
    <BannerNotificationBackground>
      <NotificationWrapper
        type={notificationType}
        centered={centered}
        dismissible
        closeButtonLabelText={t("common:close")}
        onClose={() =>
          closeFn([
            ...closedArray,
            notification.id + (notification.activeFrom ?? ""),
          ])
        }
      >
        {notification && (
          <BannerNotificationText
            dangerouslySetInnerHTML={{
              // eslint-disable-next-line @typescript-eslint/naming-convention
              __html: getTranslation(notification, "message"),
            }}
          />
        )}
      </NotificationWrapper>
    </BannerNotificationBackground>
  );
};

/// @brief List of banner notifications
/// @param displayAmount {number} - the amount of notifications to display at one time
/// @param targets {BannerNotificationTarget[]} - the targets that the notification is targeted to ("STAFF", "USER", "ALL")
/// @param centered {boolean} - whether the notification should be centered when page width exceeds xl-breakpoint
/// @return A list of banner notifications targeted to the specified targets, ordered by level (EXCEPTION, WARNING, NORMAL)
/// @desc A component which returns a list of styled banner notifications, clipped at the specified amount, targeted to the specified targets and ordered by level
/// TODO under testing: can't do target checks to the query because backend doesn't allow querying target without can_manage_notifications permission
const BannerNotificationsList = ({
  displayAmount = 2,
  centered,
}: BannerNotificationListProps) => {
  // no-cache is required because admin is caching bannerNotifications query and
  // there is no key setup for this so this query returns garbage from the admin cache.
  const { data: notificationData } = useQuery<Query>(
    BANNER_NOTIFICATIONS_LIST,
    { fetchPolicy: "no-cache" }
  );
  const notificationsList =
    notificationData?.bannerNotifications?.edges
      .map((edge) => edge?.node)
      .filter((x): x is BannerNotificationType => x != null) ?? [];

  const [closedNotificationsList, setClosedNotificationsList] = useLocalStorage<
    string[]
  >("tilavarausHKIClosedNotificationsList", []);

  // Separate notifications by level
  const errorNotificationsList = notificationsList.filter(
    (item) => item?.level === "EXCEPTION"
  );
  const alertNotificationsList = notificationsList.filter(
    (item) => item?.level === "WARNING"
  );
  const infoNotificationsList = notificationsList.filter(
    (item) => item?.level === "NORMAL"
  );
  // Merge grouped notifications prioritised by level
  const groupedNotificationsList = [
    ...errorNotificationsList,
    ...alertNotificationsList,
    ...infoNotificationsList,
  ];
  // Filter out notifications that have been closed by the user
  const displayedNotificationsList = groupedNotificationsList.filter(
    (item) =>
      closedNotificationsList != null &&
      !closedNotificationsList.includes(String(item.id + item.activeFrom))
  );

  return (
    <PositionWrapper>
      {displayedNotificationsList
        ?.slice(0, displayAmount)
        .map((notification) => (
          <NotificationsListItem
            key={notification?.id}
            notification={notification}
            closedArray={closedNotificationsList ?? []}
            closeFn={setClosedNotificationsList}
            centered={centered}
          />
        ))}
    </PositionWrapper>
  );
};

export default BannerNotificationsList;
