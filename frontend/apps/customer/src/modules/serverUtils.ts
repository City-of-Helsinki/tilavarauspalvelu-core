import { gql, NormalizedCacheObject, type ApolloClient } from "@apollo/client";
import { env } from "@/env.mjs";
import {
  TermsOfUseTypeChoices,
  TermsOfUseDocument,
  type TermsOfUseQuery,
  type TermsOfUseQueryVariables,
  type OrderQuery,
  type OrderQueryVariables,
  OrderDocument,
  type TermsOfUseFieldsFragment,
} from "@gql/gql-types";
import { getVersion } from "./baseUtils.mjs";
import { genericTermsVariant } from "./const";

export { getVersion };

export function getCommonServerSideProps() {
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
    matomoEnabled,
    hotjarEnabled,
    profileLink,
    apiBaseUrl,
    feedbackUrl,
    sentryDsn,
    sentryEnvironment,
    version,
  };
}

type GetGenericTermsReturn = TermsOfUseFieldsFragment | null;
export async function getGenericTerms(apolloClient: ApolloClient<unknown>): Promise<GetGenericTermsReturn> {
  const { data: tosData } = await apolloClient.query<TermsOfUseQuery, TermsOfUseQueryVariables>({
    query: TermsOfUseDocument,
    variables: {
      termsType: TermsOfUseTypeChoices.GenericTerms,
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

// TODO narrow down the errors properly and show the user the real reason
// requires refactoring error pages to display GQL errors
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
