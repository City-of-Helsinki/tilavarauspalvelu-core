import React from "react";
import { fontBold } from "common/src/common/typography";
import styled from "styled-components";
import { IconCross, NotificationType } from "hds-react";
import NotificationWrapper from "./common/NotificationWrapper";
import {breakpoints} from "common/src/common/style";

type UserNotificationProps = {
  date: Date;
  content: string;
  type: NotificationType;
};

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
  [class*="Notification-module_content"] {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    @media (width < ${breakpoints.l}) {
      -webkit-line-clamp: 6;
      -line-clamp: 6;
    }
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
  top: 50%;
  transform: translateY(-50%);
  padding: var(--spacing-xs);
  padding-right: 0;
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
    <NotificationBackground>
      <NotificationContainer type={type}>
        <NotificationDate>
          {`${date.getDate()}.${date.getMonth()}.`}
        </NotificationDate>
        <NotificationText>{content}</NotificationText>
        <CloseButton>
          <IconCross size="s" />
        </CloseButton>
      </NotificationContainer>
    </NotificationBackground>
  );
};

export default UserNotification;
