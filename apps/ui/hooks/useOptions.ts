import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import type { LocalizationLanguages, OptionType } from "common/types/common";
import type { Query, AgeGroupType, Maybe } from "common/types/gql-types";
import { participantCountOptions } from "@/modules/const";

export type OptionTypes = {
  ageGroupOptions: OptionType[];
  abilityGroupOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  cityOptions: OptionType[];
  purposeOptions: OptionType[];
  participantCountOptions: OptionType[];
};

type ParameterType = {
  pk: number;
  nameFi: string;
  nameEn?: string;
  nameSv?: string;
}

const getLabel = (
  parameter: ParameterType | AgeGroupType,
  lang: LocalizationLanguages = "fi"
): string => {
  if ('minimum' in parameter) {
    return `${parameter.minimum || ""} - ${parameter.maximum || ""}`;
  }
  if (parameter.nameFi && lang === "fi") {
    return parameter.nameFi;
  }
  if (parameter.nameEn && lang === "en") {
    return parameter.nameEn;
  }
  if (parameter.nameSv && lang === "sv") {
    return parameter.nameSv;
  }
  if (parameter.nameFi) {
    return parameter.nameFi;
  }
  return "no label";
};

// this is a copy from @/modules/util but it has some issues with types
// might be because of change from REST -> GQL
export const mapOptions = (
  src: ParameterType[] | AgeGroupType[],
  emptyOptionLabel?: string,
  lang: LocalizationLanguages = "fi",
): OptionType[] => {
  const r: OptionType[] = [
    ...(emptyOptionLabel ? [{ label: emptyOptionLabel, value: 0 }] : []),
    ...(src.map((v) => ({
        label: getLabel(v, lang),
        value: v.pk ?? 0,
      }))
    ),
  ]
  return r;
};

const PARAMS = gql`
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
  pk
}: {
  nameFi?: Maybe<string>,
  nameEn?: Maybe<string>,
  nameSv?: Maybe<string>,
  pk?: Maybe<number>
}) => {
  if (!nameFi || !pk) {
    // eslint-disable-next-line no-console
    console.warn('missing name or pk');
    return undefined;
  }
  if (!nameEn || !nameSv) {
    // eslint-disable-next-line no-console
    console.warn('missing nameEn or nameSv');
  }
  return { nameFi, nameEn: nameEn ?? undefined, nameSv: nameSv ?? undefined, pk };
}

const sortAgeGroups = (ageGroups: AgeGroupType[]): AgeGroupType[] => {
  return ageGroups.sort((a, b) => {
    const order = ["1-99"];
    const strA = `${a.minimum || ""}-${a.maximum || ""}`;
    const strB = `${b.minimum || ""}-${b.maximum || ""}`;

    return order.indexOf(strA) > -1 || order.indexOf(strB) > -1
      ? order.indexOf(strA) - order.indexOf(strB)
      : (a.minimum || 0) - (b.minimum || 0);
  });
};

export const useOptions = () => {
  const { i18n } = useTranslation();

  const { data, loading: isLoading } = useQuery<Query>(PARAMS);
  const ageGroups = data?.ageGroups?.edges?.map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => node !== null) ?? [];
  const cities = data?.cities?.edges?.map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => node !== null) ?? [];
  const reservationUnitTypes = data?.reservationUnitTypes?.edges?.map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => node !== null) ?? [];
  const purposes = data?.reservationPurposes?.edges?.map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => node !== null) ?? [];
  /* TODO this is missing from GraphQL schema?
  const abilityGroups = data?.abilityGroups?.edges?.map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => node !== null) ?? [];
  */

  const convertLang = (lang: string): LocalizationLanguages => {
    if (lang === "fi" || lang === "en" || lang === "sv") {
      return lang;
    }
    return "fi";
  }
  const params = {
    ageGroups,
    cities,
    reservationUnitTypes,
    purposes,
    // abilityGroups,
  };
 const options: OptionTypes = {
    ageGroupOptions: mapOptions(
      sortAgeGroups(ageGroups),
      undefined,
      convertLang(i18n.language)
    ),
    abilityGroupOptions: [],
      /* TODO
        abilityGroups: mapOptions(
          abilityGroups,
          undefined,
          i18n.language
        ),
      */
    cityOptions: mapOptions(
      cities.map((city) => maybeOption(city))
        .filter((city): city is NonNullable<typeof city> => city != null),
      undefined,
      convertLang(i18n.language)
    ),
    purposeOptions: mapOptions(
      purposes.map((p) => maybeOption(p))
        .filter((p): p is NonNullable<typeof p> => p != null),
      undefined,
      convertLang(i18n.language)
    ),
    reservationUnitTypeOptions: mapOptions(
      reservationUnitTypes.map((p) => maybeOption(p))
        .filter((p): p is NonNullable<typeof p> => p != null),
      undefined,
      convertLang(i18n.language)
    ),
    participantCountOptions,
  }

  return { isLoading, options, params };
};
