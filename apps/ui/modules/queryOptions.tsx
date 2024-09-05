import { type ApolloClient } from "@apollo/client";
import {
  OptionsDocument,
  type OptionsQueryVariables,
  type OptionsQuery,
} from "@gql/gql-types";
import { getTranslationSafe } from "common/src/common/util";
import { filterNonNullable, getLocalizationLang } from "common/src/helpers";

export async function queryOptions(
  apolloClient: ApolloClient<unknown>,
  locale: string
) {
  const { data: paramsData } = await apolloClient.query<
    OptionsQuery,
    OptionsQueryVariables
  >({
    query: OptionsDocument,
    fetchPolicy: "no-cache",
  });

  const reservationPurposes = filterNonNullable(
    paramsData.reservationPurposes?.edges?.map((e) => e?.node)
  );
  const ageGroups = filterNonNullable(
    paramsData.ageGroups?.edges?.map((e) => e?.node)
  );
  const cities = filterNonNullable(
    paramsData.cities?.edges?.map((e) => e?.node)
  );
  if (!ageGroups || ageGroups.length < 1) {
    // eslint-disable-next-line no-console
    console.warn("No ageGroups received!");
  }

  const lang = getLocalizationLang(locale);

  const sortedAgeGroups = ageGroups.sort((a, b) => a.minimum - b.minimum);
  const purposeOptions = reservationPurposes.map((purpose) => ({
    label: getTranslationSafe(purpose, "name", lang),
    value: purpose.pk ?? 0,
  }));
  const ageGroupOptions = [
    // the sortedAgeGroups array has "1 - 99" as the first element, so let's move it to the end for correct order
    ...sortedAgeGroups.slice(1),
    ...sortedAgeGroups.slice(0, 1),
  ].map((ageGroup) => ({
    label: `${ageGroup.minimum} - ${ageGroup.maximum ?? ""}`,
    value: ageGroup.pk ?? 0,
  }));
  const homeCityOptions = cities.map((city) => ({
    label: getTranslationSafe(city, "name", lang),
    value: city.pk ?? 0,
  }));

  return {
    purpose: purposeOptions,
    ageGroup: ageGroupOptions,
    homeCity: homeCityOptions,
  };
}
