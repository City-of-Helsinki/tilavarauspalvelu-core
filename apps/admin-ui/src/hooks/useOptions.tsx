import { sortBy } from "lodash-es";
import { ReservationPurposeOrderSet, useOptionsQuery } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { gql } from "@apollo/client";

export function useOptions() {
  const { data: optionsData } = useOptionsQuery({
    variables: {
      reservationPurposesOrderBy: [ReservationPurposeOrderSet.RankAsc],
    },
  });

  const purpose = filterNonNullable(optionsData?.allReservationPurposes).map((n) => ({
    label: n.nameFi ?? "",
    value: n.pk,
  }));

  const ageGroup = sortBy(optionsData?.allAgeGroups ?? [], "minimum").map((group) => ({
    label: `${group.minimum}-${group.maximum || ""}`,
    value: group.pk,
  }));

  return { ageGroup, purpose };
}

export const OPTIONS_QUERY = gql`
  query Options($reservationPurposesOrderBy: [ReservationPurposeOrderSet!]) {
    allReservationPurposes(orderBy: $reservationPurposesOrderBy) {
      id
      pk
      nameFi
    }
    allAgeGroups {
      id
      pk
      minimum
      maximum
    }
  }
`;
