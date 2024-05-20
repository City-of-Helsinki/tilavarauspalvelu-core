import { gql } from "@apollo/client";
import { BANNER_NOTIFICATION_COMMON_FRAGMENT } from "../queries/fragments";

// Always return the ALL target + either USER or STAFF target
// has to be done like this because target is a single option (not an array)
// and we can't filter on the frontend because target is not allowed in the query for unauthorized users
// query alias breaks typescript typing (refactor later if possible).
export const BANNER_NOTIFICATIONS_LIST = gql`
  ${BANNER_NOTIFICATION_COMMON_FRAGMENT}
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
