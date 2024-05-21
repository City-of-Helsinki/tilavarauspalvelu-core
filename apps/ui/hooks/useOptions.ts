import { gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import { type Maybe, useOptionsQuery, type OptionsQuery } from "@gql/gql-types";
import { participantCountOptions } from "@/modules/const";
import { filterNonNullable, getLocalizationLang } from "common/src/helpers";
import { getParameterLabel } from "@/modules/util";

// There is a duplicate in admin-ui but it doesn't have translations
// export so we can use this on SSR
export const OPTIONS_QUERY = gql`
  query Options {
    reservationUnitTypes {
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
    purposes {
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
    reservationPurposes {
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
    equipments {
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
  }
`;

// Bit paranoid checking that the query is correct
const maybeOption = ({
  nameFi,
  nameEn,
  nameSv,
  pk,
}: {
  nameFi?: Maybe<string>;
  nameEn?: Maybe<string>;
  nameSv?: Maybe<string>;
  pk?: Maybe<number>;
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

  const { data, loading: isLoading } = useOptionsQuery();
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

  const params = {
    ageGroups,
    cities,
    reservationUnitTypes,
    purposes,
  };

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
    participantCountOptions,
  };

  return { isLoading, options, params };
}
