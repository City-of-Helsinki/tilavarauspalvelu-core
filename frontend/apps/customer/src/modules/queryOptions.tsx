import type { ApolloClient } from "@apollo/client";
import { filterNonNullable, getLocalizationLang, getTranslation, sortAgeGroups } from "@ui/modules/helpers";
import type { OptionsRecord } from "@ui/types";
import { OptionsDocument } from "@gql/gql-types";
import type { OptionsQueryVariables, OptionsQuery } from "@gql/gql-types";

export async function queryOptions(
  apolloClient: ApolloClient<unknown>,
  locale: string
): Promise<Readonly<OptionsRecord>> {
  const { data } = await apolloClient.query<OptionsQuery, OptionsQueryVariables>({
    query: OptionsDocument,
    fetchPolicy: "no-cache",
  });

  const reservationPurposes = filterNonNullable(data.reservationPurposes?.edges?.map((e) => e?.node));
  const ageGroups = filterNonNullable(data.ageGroups?.edges?.map((e) => e?.node));
  if (!ageGroups || ageGroups.length === 0) {
    // eslint-disable-next-line no-console
    console.warn("No ageGroups received!");
  }

  const lang = getLocalizationLang(locale);

  const purposeOptions = reservationPurposes.map((purpose) => ({
    label: getTranslation(purpose, "name", lang),
    value: purpose.pk ?? 0,
  }));
  const ageGroupOptions = sortAgeGroups(ageGroups).map((ageGroup) => ({
    label: `${ageGroup.minimum} - ${ageGroup.maximum ?? ""}`,
    value: ageGroup.pk ?? 0,
  }));

  return {
    purpose: purposeOptions,
    ageGroup: ageGroupOptions,
  } as const;
}
