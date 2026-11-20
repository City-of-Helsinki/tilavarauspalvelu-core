import { gql } from "@apollo/client";
import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { logError } from "@ui/modules/errors";
import { filterNonNullable } from "@ui/modules/helpers";
import type { CommonEnvConfig } from "@ui/types";
import {
  TermsOfUseTypeChoices,
  TermsOfUseDocument,
  OrderDocument,
  ApplicationRoundPriceOptionsDocument,
} from "@gql/gql-types";
import type {
  TermsOfUseQuery,
  TermsOfUseQueryVariables,
  OrderQuery,
  OrderQueryVariables,
  TermsOfUseFieldsFragment,
  ApplicationRoundPriceOptionsQuery,
  ApplicationRoundPriceOptionsQueryVariables,
} from "@gql/gql-types";
import { env } from "@/env.mjs";
import { getVersion } from "./baseUtils";
import { genericTermsVariant } from "./const";

export { getVersion };

export interface CustomerEnvConfig extends CommonEnvConfig {
  isHotjarEnabled: boolean;
  isMatomoEnabled: boolean;
  profileLink: string;
}

export function getDefaultServerSideProps(): CustomerEnvConfig {
  return {
    isConsoleLoggingEnabled: true,
    isErrorTriggerEnabled: false,
    isHotjarEnabled: false,
    isMatomoEnabled: false,
    profileLink: "",
    feedbackUrl: "",
    version: getVersion(),
  };
}

export function getCommonServerSideProps(): CustomerEnvConfig {
  // NOTE don't return undefined here, it breaks JSON.stringify used by getServerSideProps
  // use null or default value instead
  const isMatomoEnabled = env.MATOMO_ENABLED ?? false;
  const isHotjarEnabled = env.HOTJAR_ENABLED ?? false;
  const profileLink = env.PROFILE_UI_URL ?? "";
  const feedbackUrl = env.FEEDBACK_URL ?? "";
  const version = getVersion();

  return {
    isConsoleLoggingEnabled: env.ENABLE_CONSOLE_LOGGING ?? false,
    isErrorTriggerEnabled: env.ENABLE_ERROR_TRIGGER ?? false,
    isHotjarEnabled,
    isMatomoEnabled,
    profileLink,
    feedbackUrl,
    version,
  };
}

type GetGenericTermsReturn = TermsOfUseFieldsFragment | null;
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
    logError(`No terms of use found for slug "${genericTermsVariant.BOOKING}"`);
  }

  return tos;
}

type ApplicationRoundPriceOption = ApplicationRoundPriceOptionsQuery["applicationRoundPriceOptions"][number];

/// The price options the application round offers. If there are any, every application section must select one.
/// Every application funnel page needs these for validating the application (the stepper and the send button).
export async function getApplicationRoundPriceOptions(
  apolloClient: ApolloClient<unknown>,
  applicationRoundPk: number | null | undefined
): Promise<ReadonlyArray<ApplicationRoundPriceOption>> {
  if (applicationRoundPk == null) {
    return [];
  }
  const { data } = await apolloClient.query<
    ApplicationRoundPriceOptionsQuery,
    ApplicationRoundPriceOptionsQueryVariables
  >({
    query: ApplicationRoundPriceOptionsDocument,
    variables: { applicationRound: applicationRoundPk },
  });
  return data?.applicationRoundPriceOptions ?? [];
}

export function toPriceOptionPkList(priceOptionList: ReadonlyArray<ApplicationRoundPriceOption>): number[] {
  return filterNonNullable(priceOptionList.map((priceOption) => priceOption.pk));
}

export const APPLICATION_ROUND_PRICE_OPTIONS_QUERY = gql`
  query ApplicationRoundPriceOptions($applicationRound: Int!) {
    applicationRoundPriceOptions(applicationRound: $applicationRound) {
      pk
      nameFi
      nameSv
      nameEn
      isActive
    }
  }
`;

export async function getReservationByOrderUuid(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  uuid: string
): Promise<NonNullable<NonNullable<OrderQuery["order"]>["reservation"]> | null> {
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
