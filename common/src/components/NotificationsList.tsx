import React from "react";
import { IconCross, NotificationType } from "hds-react";
import styled from "styled-components";
import { useLocalStorage } from "react-use";
import { useQuery } from "@apollo/client";
import NotificationWrapper from "./NotificationWrapper";
import { getTranslation } from "../common/util";
import { breakpoints } from "../common/style";
import { fontBold } from "../common/typography";
import { BannerNotificationType, Query } from "../../types/gql-types";
import { BANNER_NOTIFICATIONS_LIST } from "./BannerNotificationsQuery";

type NotificationListProps = {
  target: "USER" | "STAFF";
  centered?: boolean;
};

type NotificationItemProps = {
  notification: BannerNotificationType;
  closeFn: React.Dispatch<React.SetStateAction<string[] | undefined>>;
  closedArray: string[];
  centered?: boolean;
};

const PositionWrapper = styled.div`
  width: 100%;
  display: grid;
`;

const NotificationBackground = styled.div`
  position: relative;
  display: flex;
  section {
    border-bottom: 1px solid var(--notification-border-color);
  }
  > div {
    width: 100%;
  }
`;

const NotificationText = styled.span`
  font-size: var(--fontsize-body-m);
  @media (width < ${breakpoints.xl}) {
    padding-right: var(--spacing-l);
  }
`;

const NotificationDate = styled.span`
  margin-right: 0.25rem;
  font-size: var(--fontsize-body-m);
  ${fontBold}
`;

const CloseButton = styled.button`
  position: absolute;
  top: var(--spacing-m);
  right: var(--spacing-m);
  transform: translateY(-50%);
  padding: var(--spacing-xs);
  padding-right: 0;
  background-color: transparent;
  border: none;
  cursor: pointer;
  &:hover {
    color: var(--color-black-50);
  }
`;

const NotificationsListItem = ({
  notification,
  closeFn,
  closedArray,
  centered,
}: NotificationItemProps) => {
  const displayDate = new Date(notification.activeFrom || "");
  let notificationType: NotificationType = "info" as const;
  switch (notification.level) {
    case "EXCEPTION":
      notificationType = "alert";
      break;
    case "WARNING":
      notificationType = "error";
      break;
    default:
      notificationType = "info";
  }
  const handleCloseButtonClick = (closedId: string) => {
    closeFn([...closedArray, closedId]);
  };
  return (
    <NotificationBackground>
      <NotificationWrapper type={notificationType} centered={centered}>
        {notification.activeFrom && (
          <NotificationDate>{`${displayDate.getDate()}.${displayDate.getMonth()}.`}</NotificationDate>
        )}
        <NotificationText>
          {notification && getTranslation(notification, "message")}
        </NotificationText>
        <CloseButton onClick={() => handleCloseButtonClick(notification.id)}>
          <IconCross size="s" />
        </CloseButton>
      </NotificationWrapper>
    </NotificationBackground>
  );
};

const NotificationsList = ({ target, centered }: NotificationListProps) => {
  const { data: notificationData } = useQuery<Query>(BANNER_NOTIFICATIONS_LIST);
  const notificationsList = notificationData?.bannerNotifications?.edges.map(
    (edge) => edge?.node
  );

  const [closedNotificationsList, setClosedNotificationsList] = useLocalStorage<
    string[]
  >("tilavarausHKIClosedNotificationsList", []);
  const maximumNotificationAmount = 2;

  // Separate notifications by level
  const errorNotificationsList = notificationsList?.filter(
    (item) => item?.level === "WARNING"
  );
  const alertNotificationsList = notificationsList?.filter(
    (item) => item?.level === "EXCEPTION"
  );
  const infoNotificationsList = notificationsList?.filter(
    (item) => item?.level === "NORMAL"
  );
  // Merge grouped notifications prioritised by level
  const groupedNotificationsList = [
    ...(errorNotificationsList || []),
    ...(alertNotificationsList || []),
    ...(infoNotificationsList || []),
  ];
  // Filter out notifications that have been closed by the user, or aren't targeted to the user
  const displayedNotificationsList = groupedNotificationsList?.filter(
    (item) =>
      !(closedNotificationsList as string[]).includes(String(item?.id)) &&
      !(item?.target !== target && item?.target !== "ALL")
  );

  // TODO: Add sorting by date within level arrays
  return (
    <PositionWrapper>
      {displayedNotificationsList
        ?.slice(0, maximumNotificationAmount)
        .map((notification) => (
          <NotificationsListItem
            key={notification?.id}
            notification={notification as BannerNotificationType}
            closedArray={closedNotificationsList ?? []}
            closeFn={setClosedNotificationsList}
            centered={centered}
          />
        ))}
    </PositionWrapper>
  );
};

export default NotificationsList;
