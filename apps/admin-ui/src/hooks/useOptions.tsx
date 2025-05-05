import { sortBy } from "lodash-es";
import {
  ReservationPurposeOrderingChoices,
  useOptionsQuery,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { gql } from "@apollo/client";

export function useOptions() {
  const { data: optionsData } = useOptionsQuery({
    variables: {
      reservationPurposesOrderBy: [ReservationPurposeOrderingChoices.RankAsc],
    },
  });

  const purpose = filterNonNullable(
    optionsData?.reservationPurposes?.edges.map((x) => x?.node)
  ).map((n) => ({
    label: n.nameTranslations.fi || "-",
    value: n.pk ?? 0,
  }));

  const ageGroup = sortBy(
    filterNonNullable(optionsData?.ageGroups?.edges.map((g) => g?.node)),
    "minimum"
  ).map(({ minimum, maximum, pk }) => ({
    label: `${minimum}-${maximum || ""}`,
    value: pk ?? 0,
  }));

  const homeCity = sortBy(
    filterNonNullable(optionsData?.cities?.edges.map((x) => x?.node)),
    "nameTranslations.fi"
  ).map((n) => ({
    label: n.nameTranslations.fi || "-",
    value: n.pk ?? 0,
  }));

  return { ageGroup, purpose, homeCity };
}

export const OPTIONS_QUERY = gql`
  query Options(
    $reservationPurposesOrderBy: [ReservationPurposeOrderingChoices]
  ) {
    reservationPurposes(orderBy: $reservationPurposesOrderBy) {
      edges {
        node {
          id
          pk
          nameTranslations {
            fi
          }
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
    cities {
      edges {
        node {
          id
          pk
          nameTranslations {
            fi
          }
        }
      }
    }
  }
`;
