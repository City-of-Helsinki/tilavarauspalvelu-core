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

type BannerNotificationListProps = {
  target: "USER" | "STAFF";
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
  }
  > div {
    width: 100%;
  }
`;

const BannerNotificationText = styled.span`
  font-size: var(--fontsize-body-m);
  @media (width < ${breakpoints.xl}) {
    padding-right: var(--spacing-l);
  }
`;

const BannerNotificationDate = styled.span`
  margin-right: 0.25rem;
  font-size: var(--fontsize-body-m);
  ${fontBold}
`;

const BannerCloseButton = styled.button`
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
}: BannerNotificationItemProps) => {
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
    <BannerNotificationBackground>
      <NotificationWrapper type={notificationType} centered={centered}>
        {notification.activeFrom && (
          <BannerNotificationDate>{`${displayDate.getDate()}.${displayDate.getMonth()}.`}</BannerNotificationDate>
        )}
        <BannerNotificationText>
          {notification && getTranslation(notification, "message")}
        </BannerNotificationText>
        <BannerCloseButton
          onClick={() => handleCloseButtonClick(notification.id)}
        >
          <IconCross size="s" />
        </BannerCloseButton>
      </NotificationWrapper>
    </BannerNotificationBackground>
  );
};

const BannerNotificationsList = ({
  target,
  centered,
}: BannerNotificationListProps) => {
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

export default BannerNotificationsList;
