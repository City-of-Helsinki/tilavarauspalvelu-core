import { gql } from "@apollo/client";

export const BANNER_NOTIFICATION_COMMON = gql`
  fragment BannerNotificationCommon on BannerNotificationType {
    level
    activeFrom
    message
    messageEn
    messageFi
    messageSv
  }
`;

// TODO the list fragment doesn't need all the fields
// it needs only the pk / id, name, target, activeUntil, activeFrom, state
// so no draft or message*
const BANNER_NOTIFICATION_ADMIN_FRAGMENT = gql`
  ${BANNER_NOTIFICATION_COMMON}
  fragment BannerNotificationsAdminFragment on BannerNotificationType {
    pk
    ...BannerNotificationCommon
    name
    activeUntil
    draft
    state
  }
`;

export const BANNER_NOTIFICATIONS_ADMIN = gql`
  ${BANNER_NOTIFICATION_ADMIN_FRAGMENT}
  query BannerNotificationsAdmin($id: ID!) {
    bannerNotification(id: $id) {
      ...BannerNotificationsAdminFragment
    }
  }
`;

export const BANNER_NOTIFICATIONS_ADMIN_LIST = gql`
  ${BANNER_NOTIFICATION_ADMIN_FRAGMENT}
  query BannerNotificationsList($first: Int, $offset: Int, $orderBy: String) {
    bannerNotifications(first: $first, offset: $offset, orderBy: $orderBy) {
      edges {
        node {
          ...BannerNotificationsAdminFragment
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
  query BannerNotificationsList(
    $target: CommonBannerNotificationTargetChoices!
  ) {
    bannerNotifications(isVisible: true, target: $target) {
      edges {
        node {
          id
          ...BannerNotificationCommon
        }
      }
    }
  }
`;
