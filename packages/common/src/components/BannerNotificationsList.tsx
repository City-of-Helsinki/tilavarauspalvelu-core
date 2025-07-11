import React from "react";
import { NotificationType } from "hds-react";
import styled from "styled-components";
import { useLocalStorage } from "react-use";
import NotificationWrapper from "./NotificationWrapper";
import { breakpoints } from "../const";
import {
  BannerNotificationLevel,
  BannerNotificationTarget,
  useBannerNotificationsListAllQuery,
  useBannerNotificationsListQuery,
  type BannerNotificationCommonFragment,
} from "../../gql/gql-types";
import { filterNonNullable } from "../helpers";
import { useTranslation } from "next-i18next";
import { convertLanguageCode, getTranslationSafe } from "../common/util";

type BannerNotificationListProps = {
  target: BannerNotificationTarget;
  displayAmount?: number;
};

type NotificationsListItemProps = {
  notification: BannerNotificationCommonFragment;
  closeFn: React.Dispatch<React.SetStateAction<string[] | undefined>>;
  closedArray: string[];
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

const BannerNotificationText = styled.div`
  font-size: var(--fontsize-body-m);
  p:first-of-type {
    margin-top: 0;
  }
  a {
    text-decoration: underline;
  }
  @media (max-width: ${breakpoints.xl}) {
    padding-right: var(--spacing-l);
  }
`;

function convertNotificationType(level: BannerNotificationLevel): NotificationType {
  switch (level) {
    case BannerNotificationLevel.Exception:
      return "error";
    case BannerNotificationLevel.Warning:
      return "alert";
    case BannerNotificationLevel.Normal:
      return "info";
  }
}

function NotificationsListItem({ notification, closeFn, closedArray }: NotificationsListItemProps) {
  const { t, i18n } = useTranslation();
  const notificationType = convertNotificationType(notification.level);
  const lang = convertLanguageCode(i18n.language);
  const innerHtml = getTranslationSafe(notification, "message", lang);

  return (
    <BannerNotificationBackground>
      <NotificationWrapper
        type={notificationType}
        dismissible
        closeButtonLabelText={t("common:close")}
        data-testid="BannerNotificationList__Notification"
        onClose={() => closeFn([...closedArray, notification.id + (notification.activeFrom ?? "")])}
      >
        {notification && (
          <BannerNotificationText
            dangerouslySetInnerHTML={{
              __html: innerHtml,
            }}
          />
        )}
      </NotificationWrapper>
    </BannerNotificationBackground>
  );
}

/// @brief List of banner notifications
/// @param displayAmount {number} - the amount of notifications to display at one time
/// @param targets {BannerNotificationTarget[]} - the targets that the notification is targeted to ("STAFF", "USER", "ALL")
/// @param centered {boolean} - whether the notification should be centered when page width exceeds xl-breakpoint
/// @return A list of banner notifications targeted to the specified targets, ordered by level (EXCEPTION, WARNING, NORMAL)
/// @desc A component which returns a list of styled banner notifications, clipped at the specified amount, targeted to the specified targets and ordered by level
/// TODO under testing: can't do target checks to the query because backend doesn't allow querying target without can_manage_notifications permission
const BannerNotificationsList = ({ target, displayAmount = 2 }: BannerNotificationListProps) => {
  // no-cache is required because admin is caching bannerNotifications query and
  // there is no key setup for this so this query returns garbage from the admin cache.
  const { data } = useBannerNotificationsListQuery({
    variables: {
      target,
    },
    fetchPolicy: "no-cache",
  });
  const { data: dataAll } = useBannerNotificationsListAllQuery({
    fetchPolicy: "no-cache",
  });
  const notificationsTarget = data?.bannerNotifications;
  const notificationsAll = dataAll?.bannerNotifications;
  const comb = [...(notificationsAll?.edges ?? []), ...(notificationsTarget?.edges ?? [])];
  const notificationsList = filterNonNullable(comb.map((edge) => edge?.node));

  const [closedNotificationsList, setClosedNotificationsList] = useLocalStorage<string[]>(
    "tilavarausHKIClosedNotificationsList",
    []
  );

  // Separate notifications by level
  const errorNotificationsList = notificationsList.filter((item) => item?.level === "EXCEPTION");
  const alertNotificationsList = notificationsList.filter((item) => item?.level === "WARNING");
  const infoNotificationsList = notificationsList.filter((item) => item?.level === "NORMAL");
  // Merge grouped notifications prioritised by level
  const groupedNotificationsList = [...errorNotificationsList, ...alertNotificationsList, ...infoNotificationsList];
  // Filter out notifications that have been closed by the user
  const displayedNotificationsList = groupedNotificationsList.filter(
    (item) =>
      closedNotificationsList != null &&
      item.activeFrom != null &&
      !closedNotificationsList.includes(String(item.id + item.activeFrom))
  );

  return (
    <PositionWrapper>
      {displayedNotificationsList?.slice(0, displayAmount).map((notification) => (
        <NotificationsListItem
          key={notification?.id}
          notification={notification}
          closedArray={closedNotificationsList ?? []}
          closeFn={setClosedNotificationsList}
        />
      ))}
    </PositionWrapper>
  );
};

export default BannerNotificationsList;
