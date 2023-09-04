import React from "react";
import { fontBold } from "common/src/common/typography";
import styled from "styled-components";
import { IconCross, NotificationType } from "hds-react";
import NotificationWrapper from "./common/NotificationWrapper";

type UserNotificationProps = {
  date: Date;
  content: string;
  type: NotificationType;
};

const NotificationBackground = styled.div<{ $backgroundColor: string }>`
  position: relative;
`;

const NotificationContainer = styled(NotificationWrapper)`
  font-size: var(--fontsize-body-m);
  [class*="Notification-module_content"] {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
`;

const NotificationText = styled.span`
  font-size: var(--fontsize-body-m);
`;

const NotificationDate = styled.span`
  margin-right: 0.25rem;
  font-size: var(--fontsize-body-m);
  ${fontBold}
`;

const CloseButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: var(--spacing-xs);
  right: var(--spacing-s);
  background-color: transparent;
  border: none;
  cursor: pointer;
  &:hover {
    color: var(--color-black-50);
  }
`;

const UserNotification = ({ date, content, type }: UserNotificationProps) => {
  return (
    <NotificationBackground $backgroundColor="error">
      <NotificationContainer type={type}>
        <NotificationDate>
          {`${date.getDate()}.${date.getMonth()}.`}
        </NotificationDate>
        <NotificationText>{content}</NotificationText>
      </NotificationContainer>
      <CloseButton>
        <IconCross size="s" />
      </CloseButton>
    </NotificationBackground>
  );
};

export default UserNotification;
