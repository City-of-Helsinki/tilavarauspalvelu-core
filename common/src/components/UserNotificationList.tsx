import React from "react";
import { NotificationType } from "hds-react";
import styled from "styled-components";
import UserNotification from "./UserNotification";

const notifications = [
  {
    id: 1,
    date: new Date(),
    content:
      "Tämä on pitkä perus ilmoitus. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.",
    type: "info" as NotificationType,
  },
  {
    id: 2,
    date: new Date(),
    content:
      "Tämä on virheilmoitus. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.",
    type: "error" as NotificationType,
  },
  {
    id: 3,
    date: new Date(),
    content:
      "Tämä on varoitusilmoitus. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.",
    type: "alert" as NotificationType,
  },
];

const PositionWrapper = styled.div`
  position: absolute;
  top: 74px;
  left: 0;
  width: 100%;
`;

const UserNotificationList = ({ maxAmount = 3 }) => {
  return (
    <PositionWrapper>
      {notifications.slice(0, maxAmount).map((notification) => (
        <UserNotification
          key={notification.id}
          date={notification.date}
          content={notification.content}
          type={notification.type}
        />
      ))}
    </PositionWrapper>
  );
};

export default UserNotificationList;
