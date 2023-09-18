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

type BannerNotificationTarget = "USER" | "STAFF" | "ALL";
type BannerNotificationListProps = {
  displayAmount?: number;
  targetList: BannerNotificationTarget[];
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

const BannerNotificationDate = styled.span`
  margin-right: 0.25rem;
  font-size: var(--fontsize-body-m);
  ${fontBold}
`;

const BannerCloseButton = styled.button`
  position: absolute;
  top: var(--spacing-m);
  right: 0;
  transform: translateY(-50%);
  padding: var(--spacing-xs);
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
      notificationType = "error";
      break;
    case "WARNING":
      notificationType = "alert";
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
        {notification && (
          <BannerNotificationText
            dangerouslySetInnerHTML={{
              // eslint-disable-next-line @typescript-eslint/naming-convention
              __html: getTranslation(notification, "message"),
            }}
          />
        )}
        <BannerCloseButton
          onClick={() => handleCloseButtonClick(notification.id ?? "")}
        >
          <IconCross size="s" />
        </BannerCloseButton>
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
const BannerNotificationsList = ({
  displayAmount = 2,
  targetList = ["ALL"],
  centered,
}: BannerNotificationListProps) => {
  const { data: notificationData } = useQuery<Query>(BANNER_NOTIFICATIONS_LIST);
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
  // Filter out notifications that have been closed by the user, or aren't targeted to them
  const displayedNotificationsList = groupedNotificationsList.filter(
    (item) =>
      closedNotificationsList != null &&
      !closedNotificationsList.includes(String(item?.id ?? 0)) &&
      targetList.map((t) => t === item?.target).includes(true)
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
