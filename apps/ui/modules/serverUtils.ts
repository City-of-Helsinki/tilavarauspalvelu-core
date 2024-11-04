import { env } from "@/env.mjs";
import { NormalizedCacheObject, type ApolloClient } from "@apollo/client";
import {
  TermsType,
  TermsOfUseDocument,
  type TermsOfUseQuery,
  type TermsOfUseQueryVariables,
  type ReservationStateQuery,
  type OrderQuery,
  type OrderQueryVariables,
  OrderDocument,
  type ReservationStateQueryVariables,
  ReservationStateDocument,
} from "@gql/gql-types";
import { genericTermsVariant } from "./const";
import { base64encode } from "common/src/helpers";

export function getVersion(): string {
  return (
    env.NEXT_PUBLIC_SOURCE_BRANCH_NAME?.replace("main", "") ||
    env.NEXT_PUBLIC_SOURCE_VERSION?.slice(0, 8) ||
    "local"
  );
}

export function getCommonServerSideProps() {
  // NOTE don't return undefined here, it breaks JSON.stringify used by getServerSideProps
  // use null or default value instead
  const cookiehubEnabled = env.COOKIEHUB_ENABLED ?? false;
  const matomoEnabled = env.MATOMO_ENABLED ?? false;
  const hotjarEnabled = env.HOTJAR_ENABLED ?? false;
  const profileLink = env.PROFILE_UI_URL ?? "";
  const apiBaseUrl = env.TILAVARAUS_API_URL ?? "";
  const feedbackUrl = env.EMAIL_VARAAMO_EXT_LINK ?? "";
  const sentryDsn = env.SENTRY_DSN ?? "";
  const sentryEnvironment = env.SENTRY_ENVIRONMENT ?? "";
  const version = getVersion();

  return {
    cookiehubEnabled,
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

export async function getGenericTerms(apolloClient: ApolloClient<unknown>) {
  const { data: tosData } = await apolloClient.query<
    TermsOfUseQuery,
    TermsOfUseQueryVariables
  >({
    query: TermsOfUseDocument,
    variables: {
      termsType: TermsType.GenericTerms,
    },
  });

  // TODO missing backend filtering
  const tos =
    tosData?.termsOfUse?.edges
      ?.map((e) => e?.node)
      .find((node) => node?.pk === genericTermsVariant.BOOKING) ?? null;

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
): Promise<NonNullable<ReservationStateQuery["reservation"]> | null> {
  // TODO retry once if not found (or increase the timeout so the webhook from store has fired)
  const { data: orderData } = await apolloClient.query<
    OrderQuery,
    OrderQueryVariables
  >({
    query: OrderDocument,
    variables: { orderUuid: uuid },
  });

  const order = orderData?.order ?? undefined;
  const { reservationPk: pk } = order ?? {};
  if (!pk) {
    return null;
  }

  const id = base64encode(`ReservationNode:${pk}`);
  const { data } = await apolloClient.query<
    ReservationStateQuery,
    ReservationStateQueryVariables
  >({
    query: ReservationStateDocument,
    variables: { id },
  });

  return data?.reservation ?? null;
}
