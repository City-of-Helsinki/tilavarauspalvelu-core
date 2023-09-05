import React from "react";
import styled from "styled-components";
import { IconCross, NotificationType } from "hds-react";
import NotificationWrapper from "ui/components/common/NotificationWrapper";
import { fontBold } from "../common/typography";
import { breakpoints } from "../common/style";

type UserNotificationProps = {
  date: Date;
  content: string;
  type: NotificationType;
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
  right: var(--spacing-s);
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
