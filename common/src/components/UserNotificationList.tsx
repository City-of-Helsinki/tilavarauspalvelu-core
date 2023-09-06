import React from "react";
import { NotificationType } from "hds-react";
import styled from "styled-components";
import UserNotification from "./UserNotification";

const notifications = [
  {
    id: 1,
    date: new Date(),
    content:
      "Proin enim quam, pretium ut posuere id, iaculis vel sapien. Nam maximus lectus rhoncus augue porttitor posuere. Morbi sed cursus lectus. Nulla ullamcorper, neque at molestie lacinia, ex erat imperdiet lacus, vel dignissim nisl dui a dolor. Vestibulum tincidunt a elit in pharetra. Vivamus congue, orci in rhoncus fermentum, ex ligula tristique sapien, ac mattis enim mi ut mauris. Suspendisse maximus mollis lacus non porttitor. Nulla interdum velit quis sem pellentesque varius. Donec molestie odio.",
    type: "info" as NotificationType,
  },
  {
    id: 2,
    date: new Date(),
    content:
      "Nullam pretium, dui a vulputate lacinia, magna nisi vulputate nunc, et pulvinar quam dolor eget lacus. Mauris ut sem at libero luctus varius quis at ipsum. Sed et porttitor justo, non sodales dui. In pretium mi id ipsum aliquet, id ultrices ligula consectetur. Nunc in orci bibendum purus posuere ornare. Cras vel iaculis eros, in cursus diam. Ut faucibus ornare augue ac congue. Proin id lacus pharetra mi vehicula sollicitudin. Cras eget ultricies nisi, ac placerat leo. Nunc ac erat nunc placerat.",
    type: "error" as NotificationType,
  },
  {
    id: 3,
    date: new Date(),
    content:
      "Sed auctor finibus tristique. Nam ut dolor id enim facilisis iaculis. Aenean vel gravida dui. Pellentesque fermentum lobortis diam, congue fringilla ipsum. Fusce at dolor magna. Donec quis nibh ut nisl condimentum aliquet luctus in ligula. Aliquam erat volutpat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aliquam congue tincidunt fringilla. Donec vulputate tortor malesuada odio aliquet, nec consectetur ipsum lobortis. Nulla vitae felis et justo libero.",
    type: "alert" as NotificationType,
  },
];

const PositionWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
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
