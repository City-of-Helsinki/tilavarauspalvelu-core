import React from "react";
import { IconCross, NotificationType } from "hds-react";
import styled from "styled-components";
import NotificationWrapper from "ui/components/common/NotificationWrapper";
import { getTranslation } from "ui/modules/util";
import { breakpoints } from "../common/style";
import { fontBold } from "../common/typography";
// eslint-disable-next-line camelcase
import { Notification_Type } from "../../types/gql-types";

type NotificationListProps = {
  // eslint-disable-next-line camelcase
  notifications: Notification_Type[];
};

const mockNotifications = [
  {
    id: "1",
    date: "6.9.",
    contentFi:
      "Proin enim quam, pretium ut posuere id, iaculis vel sapien. Nam maximus lectus rhoncus augue porttitor posuere. Morbi sed cursus lectus. Nulla ullamcorper, neque at molestie lacinia, ex erat imperdiet lacus, vel dignissim nisl dui a dolor. Vestibulum tincidunt a elit in pharetra. Vivamus congue, orci in rhoncus fermentum, ex ligula tristique sapien, ac mattis enim mi ut mauris. Suspendisse maximus mollis lacus non porttitor. Nulla interdum velit quis sem pellentesque varius. Donec molestie odio.",
    type: "info" as NotificationType,
    target: "user",
    is_visible: true,
  },
  {
    id: "2",
    date: "6.9.",
    contentFi:
      "Nullam pretium, dui a vulputate lacinia, magna nisi vulputate nunc, et pulvinar quam dolor eget lacus. Mauris ut sem at libero luctus varius quis at ipsum. Sed et porttitor justo, non sodales dui. In pretium mi id ipsum aliquet, id ultrices ligula consectetur. Nunc in orci bibendum purus posuere ornare. Cras vel iaculis eros, in cursus diam. Ut faucibus ornare augue ac congue. Proin id lacus pharetra mi vehicula sollicitudin. Cras eget ultricies nisi, ac placerat leo. Nunc ac erat nunc placerat.",
    type: "error" as NotificationType,
    target: "user",
    is_visible: true,
  },
  {
    id: "3",
    date: "6.9.",
    contentFi:
      "Sed auctor finibus tristique. Nam ut dolor id enim facilisis iaculis. Aenean vel gravida dui. Pellentesque fermentum lobortis diam, congue fringilla ipsum. Fusce at dolor magna. Donec quis nibh ut nisl condimentum aliquet luctus in ligula. Aliquam erat volutpat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aliquam congue tincidunt fringilla. Donec vulputate tortor malesuada odio aliquet, nec consectetur ipsum lobortis. Nulla vitae felis et justo libero.",
    type: "alert" as NotificationType,
    target: "user",
    is_visible: true,
  },
];

const PositionWrapper = styled.div`
  width: 100%;
  display: grid;
`;

type NotificationItemProps = {
  date?: string;
  content?: string;
  type?: NotificationType;
};

const NotificationBackground = styled.div`
  position: relative;
  z-index: 1000;
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

const NotificationItem = ({ date, content, type }: NotificationItemProps) => {
  return (
    <NotificationBackground>
      <NotificationContainer type={type}>
        {date && <NotificationDate>{date}</NotificationDate>}
        <NotificationText>{content}</NotificationText>
        <CloseButton>
          <IconCross size="s" />
        </CloseButton>
      </NotificationContainer>
    </NotificationBackground>
  );
};

const NotificationList = ({
  notifications = mockNotifications,
}: NotificationListProps) => {
  const maxAmount = 3;
  return (
    <PositionWrapper>
      {notifications.slice(0, maxAmount).map((notification) => (
        <NotificationItem
          key={notification.id}
          date={notification.date}
          content={getTranslation(notification, "content")}
          type={notification.type}
        />
      ))}
    </PositionWrapper>
  );
};

export default NotificationList;
