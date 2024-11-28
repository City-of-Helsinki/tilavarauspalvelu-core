import { sortBy } from "lodash";
import {
  ReservationPurposeOrderingChoices,
  useOptionsQuery,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";

export function useOptions() {
  const { data: optionsData } = useOptionsQuery({
    variables: {
      reservationPurposesOrderBy: [ReservationPurposeOrderingChoices.RankAsc],
    },
  });

  const purpose = filterNonNullable(
    optionsData?.reservationPurposes?.edges
  ).map((purposeType) => ({
    label: purposeType?.node?.nameFi ?? "",
    value: Number(purposeType?.node?.pk),
  }));

  const ageGroup = sortBy(
    optionsData?.ageGroups?.edges || [],
    "node.minimum"
  ).map((group) => ({
    label: `${group?.node?.minimum}-${group?.node?.maximum || ""}`,
    value: Number(group?.node?.pk),
  }));

  const homeCity = sortBy(optionsData?.cities?.edges || [], "node.nameFi").map(
    (cityType) => ({
      label: cityType?.node?.nameFi ?? "",
      value: Number(cityType?.node?.pk),
    })
  );

  return { ageGroup, purpose, homeCity };
}
