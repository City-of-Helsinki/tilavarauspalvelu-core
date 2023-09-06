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
};

type NotificationItemProps = {
  notification: BannerNotificationType;
  closeFn: React.Dispatch<React.SetStateAction<string[] | undefined>>;
};

const PositionWrapper = styled.div`
  width: 100%;
  display: grid;
`;

const NotificationBackground = styled.div`
  position: relative;
  display: flex;
  > div {
    width: 100vw;
  }
`;

const NotificationContainer = styled(NotificationWrapper)`
  font-size: var(--fontsize-body-m);
  width: calc(100vw - 48px);
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

const NotificationItem = ({ notification, closeFn }: NotificationItemProps) => {
  const displayDate = new Date(notification.activeFrom || "");
  let notificationType;
  switch (notification.level) {
    case "EXCEPTION":
      notificationType = "alert" as NotificationType;
      break;
    case "WARNING":
      notificationType = "error" as NotificationType;
      break;
    default:
      notificationType = "info" as NotificationType;
  }
  const handleCloseButtonClick = () => {
    closeFn((prev) => {
      if (!prev?.length) return [notification.id];
      return [...prev, notification.id];
    });
  };
  return (
    <NotificationBackground>
      <NotificationContainer type={notificationType}>
        {notification.activeFrom && (
          <NotificationDate>{`${displayDate.getDate()}.${displayDate.getMonth()}`}</NotificationDate>
        )}
        <NotificationText>
          {getTranslation(notification, "message")}
        </NotificationText>
        <CloseButton onClick={() => handleCloseButtonClick()}>
          <IconCross size="s" />
        </CloseButton>
      </NotificationContainer>
    </NotificationBackground>
  );
};

const NotificationsList = ({ target }: NotificationListProps) => {
  const { data: notificationData } = useQuery<Query>(BANNER_NOTIFICATIONS_LIST);

  const notificationsList = notificationData?.bannerNotifications?.edges.map(
    (edge) => edge?.node
  );

  const [closedNotificationsList, setClosedNotificationsList] = useLocalStorage<
    string[]
  >("seenNotificationsList", []);
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
    (item) => {
      if (
        !closedNotificationsList ||
        closedNotificationsList.includes(item?.id as never) ||
        item?.target !== target
      ) {
        return false;
      }
      return true;
    }
  );

  // TODO: Add sorting by date within level arrays
  return (
    <PositionWrapper>
      {displayedNotificationsList
        ?.slice(0, maximumNotificationAmount)
        .map((notification) => (
          <NotificationItem
            key={notification?.id}
            notification={notification as BannerNotificationType}
            closeFn={setClosedNotificationsList}
          />
        ))}
    </PositionWrapper>
  );
};

export default NotificationsList;
