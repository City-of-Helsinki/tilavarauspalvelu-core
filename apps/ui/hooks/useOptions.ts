import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import type { OptionType } from "common/types/common";
import type { Query, AgeGroupNode, Maybe } from "common/types/gql-types";
import { participantCountOptions } from "@/modules/const";
import { mapOptions } from "@/modules/util";
import { filterNonNullable, getLocalizationLang } from "common/src/helpers";

export type OptionTypes = {
  ageGroupOptions: OptionType[];
  abilityGroupOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  cityOptions: OptionType[];
  purposeOptions: OptionType[];
  participantCountOptions: OptionType[];
};

// There is a duplicate in admin-ui but it doesn't have translations
// export so we can use this on SSR
export const OPTIONS_QUERY = gql`
  query Params {
    reservationUnitTypes {
      edges {
        node {
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
          pk
          minimum
          maximum
        }
      }
    }
    cities {
      edges {
        node {
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

const sortAgeGroups = (ageGroups: AgeGroupNode[]): AgeGroupNode[] => {
  return ageGroups.sort((a, b) => {
    const order = ["1-99"];
    const strA = `${a.minimum || ""}-${a.maximum || ""}`;
    const strB = `${b.minimum || ""}-${b.maximum || ""}`;

    return order.includes(strA) || order.includes(strB)
      ? order.indexOf(strA) - order.indexOf(strB)
      : (a.minimum || 0) - (b.minimum || 0);
  });
};

export const useOptions = () => {
  const { i18n } = useTranslation();

  const { data, loading: isLoading } = useQuery<Query>(OPTIONS_QUERY);
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
  const options: OptionTypes = {
    ageGroupOptions: mapOptions(
      sortAgeGroups(ageGroups),
      undefined,
      getLocalizationLang(i18n.language)
    ),
    // TODO remove abilityGroups
    abilityGroupOptions: [],
    cityOptions: mapOptions(
      filterNonNullable(cities.map((city) => maybeOption(city))),
      undefined,
      getLocalizationLang(i18n.language)
    ),
    purposeOptions: mapOptions(
      filterNonNullable(purposes.map((p) => maybeOption(p))),
      undefined,
      getLocalizationLang(i18n.language)
    ),
    reservationUnitTypeOptions: mapOptions(
      filterNonNullable(reservationUnitTypes.map((p) => maybeOption(p))),
      undefined,
      getLocalizationLang(i18n.language)
    ),
    participantCountOptions,
  };

  return { isLoading, options, params };
};
