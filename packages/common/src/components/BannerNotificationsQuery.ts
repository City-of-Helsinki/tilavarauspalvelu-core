import { gql } from "@apollo/client";

// TODO remove the extras that I added to this query (the UI side)
export const BANNER_NOTIFICATION_COMMON = gql`
  fragment BannerNotificationCommon on BannerNotificationType {
    pk
    name
    state
    level
    message
    activeFrom
    messageEn
    messageFi
    messageSv
    target
  }
`;

export const BANNER_NOTIFICATIONS_ADMIN_LIST = gql`
  ${BANNER_NOTIFICATION_COMMON}
  query BannerNotificationsList {
    bannerNotifications {
      edges {
        node {
          ...BannerNotificationCommon
          activeUntil
          draft
        }
      }
    }
  }
`;

export const BANNER_NOTIFICATIONS_LIST = gql`
  ${BANNER_NOTIFICATION_COMMON}
  query BannerNotificationsList {
    bannerNotifications(isVisible: true) {
      edges {
        node {
          ...BannerNotificationCommon
        }
      }
    }
  }
`;
