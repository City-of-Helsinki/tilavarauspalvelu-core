import { gql } from "@apollo/client";

// TODO remove the extras that I added to this query (the UI side)
export const BANNER_NOTIFICATION_COMMON = gql`
  fragment BannerNotificationCommon on BannerNotificationType {
    level
    message
    activeFrom
    messageEn
    messageFi
    messageSv
  }
`;

export const BANNER_NOTIFICATIONS_ADMIN_LIST = gql`
  ${BANNER_NOTIFICATION_COMMON}
  query BannerNotificationsList($first: Int, $offset: Int, $orderBy: String) {
    bannerNotifications(first: $first, offset: $offset, orderBy: $orderBy) {
      edges {
        node {
          pk
          ...BannerNotificationCommon
          target
          name
          activeUntil
          draft
          state
        }
      }
      pageInfo {
        hasNextPage
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

export const BANNER_NOTIFICATIONS_LIST = gql`
  ${BANNER_NOTIFICATION_COMMON}
  query BannerNotificationsList {
    bannerNotifications(isVisible: true) {
      edges {
        node {
          id
          ...BannerNotificationCommon
        }
      }
    }
  }
`;
