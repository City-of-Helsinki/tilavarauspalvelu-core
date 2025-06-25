import { sortBy } from "lodash-es";
import { ReservationPurposeOrderingChoices, useOptionsQuery } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { gql } from "@apollo/client";

export function useOptions() {
  const { data: optionsData } = useOptionsQuery({
    variables: {
      reservationPurposesOrderBy: [ReservationPurposeOrderingChoices.RankAsc],
    },
  });

  const purpose = filterNonNullable(optionsData?.reservationPurposes?.edges).map((purposeType) => ({
    label: purposeType?.node?.nameFi ?? "",
    value: Number(purposeType?.node?.pk),
  }));

  const ageGroup = sortBy(optionsData?.ageGroups?.edges || [], "node.minimum").map((group) => ({
    label: `${group?.node?.minimum}-${group?.node?.maximum || ""}`,
    value: Number(group?.node?.pk),
  }));

  return { ageGroup, purpose };
}

export const OPTIONS_QUERY = gql`
  query Options($reservationPurposesOrderBy: [ReservationPurposeOrderingChoices]) {
    reservationPurposes(orderBy: $reservationPurposesOrderBy) {
      edges {
        node {
          id
          pk
          nameFi
        }
      }
    }
    ageGroups {
      edges {
        node {
          id
          pk
          minimum
          maximum
        }
      }
    }
  }
`;
