import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import { OptionType } from "common/types/common";
import type { Query, AgeGroupType } from "common/types/gql-types";
import { participantCountOptions } from "@/modules/const";
import { mapOptions } from "@/modules/util";

export type OptionTypes = {
  ageGroupOptions: OptionType[];
  abilityGroupOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  cityOptions: OptionType[];
  purposeOptions: OptionType[];
  participantCountOptions: OptionType[];
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
  const reservationUnitTypes = data?.reservationUnitTypes?.edges?.map(
    (edge) => edge?.node
  )
    .filter((node): node is NonNullable<typeof node> => node !== null) ?? [];
  const purposes = data?.reservationPurposes?.edges?.map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => node !== null) ?? [];
  /* TODO this is missing from GraphQL schema?
  const abilityGroups = data?.abilityGroups?.edges?.map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => node !== null) ?? [];
  */

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
          i18n.language
        ),
        abilityGroupOptions: [],
      /*
        abilityGroups: mapOptions(
          abilityGroups,
          undefined,
          i18n.language
        ),
      */
        cityOptions: mapOptions(cities,
          undefined,
          i18n.language
        ),
        purposeOptions: mapOptions(
          purposes,
          undefined,
          i18n.language
        ),
        reservationUnitTypeOptions: mapOptions(
          reservationUnitTypes,
          undefined,
          i18n.language
        ),
        participantCountOptions,
      }

  return { isLoading, options, params };
};
