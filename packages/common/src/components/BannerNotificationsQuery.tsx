import { gql } from "@apollo/client";

export const BANNER_NOTIFICATION_COMMON = gql`
  fragment BannerNotificationCommon on BannerNotificationNode {
    id
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
  fragment BannerNotificationsAdminFragment on BannerNotificationNode {
    pk
    ...BannerNotificationCommon
    name
    target
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
  query BannerNotificationsAdminList(
    $first: Int
    $offset: Int
    $orderBy: [BannerNotificationOrderingChoices]
  ) {
    bannerNotifications(first: $first, offset: $offset, orderBy: $orderBy) {
      edges {
        node {
          ...BannerNotificationsAdminFragment
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

// Always return the ALL target + either USER or STAFF target
// has to be done like this because target is a single option (not an array)
// and we can't filter on the frontend because target is not allowed in the query for unauthorized users
// query alias breaks typescript typing (refactor later if possible).
export const BANNER_NOTIFICATIONS_LIST = gql`
  ${BANNER_NOTIFICATION_COMMON}
  query BannerNotificationsList($target: BannerNotificationTarget!) {
    bannerNotifications(isVisible: true, target: $target) {
      edges {
        node {
          ...BannerNotificationCommon
        }
      }
    }
    bannerNotificationsAll: bannerNotifications(isVisible: true, target: ALL) {
      edges {
        node {
          ...BannerNotificationCommon
        }
      }
    }
  }
`;
