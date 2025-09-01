import { type ApolloClient } from "@apollo/client";
import { OptionsDocument, type OptionsQueryVariables, type OptionsQuery } from "@gql/gql-types";
import { getTranslationSafe } from "common/src/common/util";
import { filterNonNullable, getLocalizationLang, sort } from "common/src/helpers";

export async function queryOptions(apolloClient: ApolloClient<unknown>, locale: string) {
  const { data } = await apolloClient.query<OptionsQuery, OptionsQueryVariables>({
    query: OptionsDocument,
    fetchPolicy: "no-cache",
    // NOTE always include (empty) variables otherwise the Variable type is not enforced
    variables: {},
  });

  const lang = getLocalizationLang(locale);

  // incorrect non-nullable types for data
  const reservationPurposeOptions = filterNonNullable(data?.allReservationPurposes).map((purpose) => ({
    label: getTranslationSafe(purpose, "name", lang),
    value: purpose.pk ?? 0,
  }));

  const sortedAgeGroups = sort(filterNonNullable(data?.allAgeGroups), (a, b) => a.minimum - b.minimum);
  const ageGroupOptions = [
    // the sortedAgeGroups array has "1 - 99" as the first element, so let's move it to the end for correct order
    ...sortedAgeGroups.slice(1),
    ...sortedAgeGroups.slice(0, 1),
  ].map((ageGroup) => ({
    label: `${ageGroup.minimum} - ${ageGroup.maximum ?? ""}`,
    value: ageGroup.pk ?? 0,
  }));

  return {
    reservationPurposes: reservationPurposeOptions,
    ageGroups: ageGroupOptions,
  };
}
