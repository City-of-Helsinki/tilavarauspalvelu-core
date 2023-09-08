import { gql } from "@apollo/client";

export const BANNER_NOTIFICATIONS_LIST = gql`
  query BannerNotificationsList {
    bannerNotifications(isVisible: true) {
      edges {
        node {
          id
          level
          message
          activeFrom
          messageEn
          messageFi
          messageSv
          target
        }
      }
    }
  }
`;
