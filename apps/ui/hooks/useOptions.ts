import { gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import {
  type Maybe,
  type OptionsQuery,
  OptionsQueryVariables,
  ReservationPurposeOrderingChoices,
  ReservationUnitTypeOrderingChoices,
  useOptionsQuery,
} from "@gql/gql-types";
import { filterNonNullable, getLocalizationLang } from "common/src/helpers";
import { getParameterLabel } from "@/modules/util";

// There is a duplicate in admin-ui but it doesn't have translations
export const OPTIONS_QUERY = gql`
  query Options(
    $reservationUnitTypesOrderBy: [ReservationUnitTypeOrderingChoices]
    $purposesOrderBy: [PurposeOrderingChoices]
    $unitsOrderBy: [UnitOrderingChoices]
    $equipmentsOrderBy: [EquipmentOrderingChoices]
    $reservationPurposesOrderBy: [ReservationPurposeOrderingChoices]
    $onlyDirectBookable: Boolean
    $onlySeasonalBookable: Boolean
  ) {
    reservationUnitTypes(orderBy: $reservationUnitTypesOrderBy) {
      edges {
        node {
          id
          pk
          nameFi
          nameEn
          nameSv
        }
      }
    }
    purposes(orderBy: $purposesOrderBy) {
      edges {
        node {
          id
          pk
          nameFi
          nameEn
          nameSv
        }
      }
    }
    reservationPurposes(orderBy: $reservationPurposesOrderBy) {
      edges {
        node {
          id
          pk
          nameFi
          nameEn
          nameSv
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
          nameFi
          nameEn
          nameSv
        }
      }
    }
    equipmentsAll(orderBy: $equipmentsOrderBy) {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    unitsAll(
      publishedReservationUnits: true
      onlyDirectBookable: $onlyDirectBookable
      onlySeasonalBookable: $onlySeasonalBookable
      orderBy: $unitsOrderBy
    ) {
      id
      pk
      nameFi
      nameSv
      nameEn
    }
  }
`;

// Bit paranoid checking that the query is correct
const maybeOption = ({
  nameFi,
  nameEn,
  nameSv,
  pk,
}: {
  nameFi: Maybe<string>;
  nameEn: Maybe<string>;
  nameSv: Maybe<string>;
  pk: Maybe<number>;
}) => {
  if (!nameFi || !pk) {
    // eslint-disable-next-line no-console
    console.warn("missing name or pk");
    return undefined;
  }
  if (!nameEn || !nameSv) {
    // eslint-disable-next-line no-console
    console.warn("missing nameEn or nameSv");
  }
  return {
    nameFi,
    nameEn: nameEn ?? undefined,
    nameSv: nameSv ?? undefined,
    pk,
  };
};

type AgeGroup = NonNullable<
  NonNullable<OptionsQuery["ageGroups"]>["edges"][0]
>["node"];
function sortAgeGroups(ageGroups: AgeGroup[]): AgeGroup[] {
  return filterNonNullable(ageGroups).sort((a, b) => {
    const order = ["1-99"];
    const strA = `${a.minimum || ""}-${a.maximum || ""}`;
    const strB = `${b.minimum || ""}-${b.maximum || ""}`;

    return order.includes(strA) || order.includes(strB)
      ? order.indexOf(strA) - order.indexOf(strB)
      : (a.minimum || 0) - (b.minimum || 0);
  });
}

export function useOptions() {
  const { i18n } = useTranslation();

  const variables: OptionsQueryVariables = {
    reservationUnitTypesOrderBy: ReservationUnitTypeOrderingChoices.RankAsc,
    reservationPurposesOrderBy: ReservationPurposeOrderingChoices.RankAsc,
    unitsOrderBy: [],
    equipmentsOrderBy: [],
    purposesOrderBy: [],
  };
  const { data, loading: isLoading } = useOptionsQuery({
    variables,
  });
  const ageGroups = filterNonNullable(
    data?.ageGroups?.edges?.map((edge) => edge?.node)
  );
  const cities = filterNonNullable(
    data?.cities?.edges?.map((edge) => edge?.node)
  );
  const reservationUnitTypes = filterNonNullable(
    data?.reservationUnitTypes?.edges?.map((edge) => edge?.node)
  );
  const purposes = filterNonNullable(
    data?.reservationPurposes?.edges?.map((edge) => edge?.node)
  );

  const lang = getLocalizationLang(i18n.language);
  const ageGroupOptions = filterNonNullable(sortAgeGroups(ageGroups)).map(
    (v) => ({
      label: getParameterLabel(v, lang),
      value: v.pk ?? 0,
    })
  );

  const cityOptions = filterNonNullable(
    cities.map((city) => maybeOption(city))
  ).map((v) => ({
    label: getParameterLabel(v, lang),
    value: v.pk ?? 0,
  }));
  const purposeOptions = filterNonNullable(
    purposes.map((p) => maybeOption(p))
  ).map((v) => ({
    label: getParameterLabel(v, lang),
    value: v.pk ?? 0,
  }));
  const reservationUnitTypeOptions = filterNonNullable(
    reservationUnitTypes.map((p) => maybeOption(p))
  ).map((v) => ({
    label: getParameterLabel(v, lang),
    value: v.pk ?? 0,
  }));

  const options = {
    ageGroupOptions,
    cityOptions,
    purposeOptions,
    reservationUnitTypeOptions,
  };

  return { isLoading, options };
}
