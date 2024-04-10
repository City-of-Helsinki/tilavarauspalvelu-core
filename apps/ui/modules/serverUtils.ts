import { env } from "@/env.mjs";
import { type ApolloClient } from "@apollo/client";
import {
  type Query,
  type QueryTermsOfUseArgs,
  TermsType,
} from "common/types/gql-types";
import { TERMS_OF_USE } from "./queries/reservationUnit";
import { genericTermsVariant } from "./const";

export function getCommonServerSideProps() {
  // NOTE don't return undefined here, it breaks JSON.stringify used by getServerSideProps
  // use null or default value instead
  const cookiehubEnabled = env.COOKIEHUB_ENABLED ?? false;
  const matomoEnabled = env.MATOMO_ENABLED ?? false;
  const hotjarEnabled = env.HOTJAR_ENABLED ?? false;
  const profileLink = env.PROFILE_UI_URL ?? "";
  const apiBaseUrl = env.TILAVARAUS_API_URL ?? "";

  return {
    cookiehubEnabled,
    matomoEnabled,
    hotjarEnabled,
    profileLink,
    apiBaseUrl,
  };
}

export async function getGenericTerms(apolloClient: ApolloClient<unknown>) {
  const { data: tosData } = await apolloClient.query<
    Query,
    QueryTermsOfUseArgs
  >({
    query: TERMS_OF_USE,
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
