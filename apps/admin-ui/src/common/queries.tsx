import { gql } from "@apollo/client";

// TODO the list fragment doesn't need all the fields
// it needs only the pk / id, name, target, activeUntil, activeFrom, state
// so no draft or message*
const BANNER_NOTIFICATION_ADMIN_FRAGMENT = gql`
  fragment BannerNotificationsAdmin on BannerNotificationNode {
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
      ...BannerNotificationsAdmin
    }
  }
`;

export const BANNER_NOTIFICATIONS_ADMIN_LIST = gql`
  ${BANNER_NOTIFICATION_ADMIN_FRAGMENT}
  query BannerNotificationsAdminList(
    $first: Int
    $after: String
    $orderBy: [BannerNotificationOrderingChoices]
  ) {
    bannerNotifications(first: $first, after: $after, orderBy: $orderBy) {
      edges {
        node {
          ...BannerNotificationsAdmin
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
