import { gql } from "@apollo/client";
import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import type { CommonEnvConfig } from "@ui/types";
import { env } from "@/env.mjs";
import { TermsOfUseTypeChoices, TermsOfUseDocument, OrderDocument } from "@gql/gql-types";
import type {
  TermsOfUseQuery,
  TermsOfUseQueryVariables,
  OrderQuery,
  OrderQueryVariables,
  TermsOfUseFieldsFragment,
} from "@gql/gql-types";
import { getVersion } from "./baseUtils";
import { genericTermsVariant } from "./const";

export { getVersion };

export interface CustomerEnvConfig extends CommonEnvConfig {
  matomoEnabled: boolean;
  hotjarEnabled: boolean;
  profileLink: string;
}

/**
 * Returns default server-side props with empty/false values
 * Used as fallback when environment variables are not available
 * @returns CustomerEnvConfig with default values
 */
export function getDefaultServerSideProps(): CustomerEnvConfig {
  return {
    apiBaseUrl: "",
    matomoEnabled: false,
    hotjarEnabled: false,
    profileLink: "",
    feedbackUrl: "",
    sentryDsn: "",
    sentryEnvironment: "",
    version: getVersion(),
  };
}

/**
 * Returns common server-side props populated from environment variables
 * @returns CustomerEnvConfig with values from environment variables or defaults
 * @note Returns null or empty strings instead of undefined to avoid breaking JSON.stringify in getServerSideProps
 */
export function getCommonServerSideProps(): CustomerEnvConfig {
  // NOTE don't return undefined here, it breaks JSON.stringify used by getServerSideProps
  // use null or default value instead
  const matomoEnabled = env.MATOMO_ENABLED ?? false;
  const hotjarEnabled = env.HOTJAR_ENABLED ?? false;
  const profileLink = env.PROFILE_UI_URL ?? "";
  const apiBaseUrl = env.TILAVARAUS_API_URL ?? "";
  const feedbackUrl = env.EMAIL_VARAAMO_EXT_LINK ?? "";
  const sentryDsn = env.SENTRY_DSN ?? "";
  const sentryEnvironment = env.SENTRY_ENVIRONMENT ?? "";
  const version = getVersion();

  return {
    apiBaseUrl,
    matomoEnabled,
    hotjarEnabled,
    profileLink,
    feedbackUrl,
    sentryDsn,
    sentryEnvironment,
    version,
  };
}

type GetGenericTermsReturn = TermsOfUseFieldsFragment | null;
/**
 * Fetches generic booking terms of use from the API on the server side
 * @param apolloClient - Apollo Client instance for making GraphQL queries
 * @returns Generic terms of use fragment or null if not found
 * @note Logs error to console if terms are missing but does not throw
 */
export async function getGenericTerms(apolloClient: ApolloClient<unknown>): Promise<GetGenericTermsReturn> {
  const { data: tosData } = await apolloClient.query<TermsOfUseQuery, TermsOfUseQueryVariables>({
    query: TermsOfUseDocument,
    variables: {
      termsType: TermsOfUseTypeChoices.Generic,
      pk: genericTermsVariant.BOOKING,
    },
  });

  const tos = tosData?.termsOfUse?.edges?.map((e) => e?.node).find(() => true) ?? null;

  // NOTE there is no error reporting in the Pages even though this is required data
  // so Pages / Components might return null if tos is missing
  if (tos == null) {
    // eslint-disable-next-line no-console
    console.error("No terms of use found");
  }

  return tos;
}

/**
 * Fetches a reservation by order UUID from the API on the server side
 * @param apolloClient - Apollo Client instance for making GraphQL queries
 * @param uuid - Order UUID to look up
 * @returns Reservation object if found, null otherwise
 * @todo Narrow down errors properly and show user the real reason - requires refactoring error pages
 * @todo Retry once if not found (or increase timeout so webhook from store has fired)
 */
export async function getReservationByOrderUuid(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  uuid: string
): Promise<NonNullable<NonNullable<OrderQuery["order"]>["reservation"]> | null> {
  // TODO retry once if not found (or increase the timeout so the webhook from store has fired)
  const { data } = await apolloClient.query<OrderQuery, OrderQueryVariables>({
    query: OrderDocument,
    variables: { orderUuid: uuid },
  });

  const order = data?.order;
  const pk = order?.reservation?.pk;
  if (!pk) {
    return null;
  }

  return order.reservation ?? null;
}

// NOTE: Needs to match ReservationStateQuery
export const GET_ORDER = gql`
  query Order($orderUuid: String!) {
    order(orderUuid: $orderUuid) {
      id
      reservation {
        id
        pk
        state
        paymentOrder {
          id
          status
          handledPaymentDueBy
        }
      }
      status
      paymentType
      receiptUrl
      checkoutUrl
    }
  }
`;
