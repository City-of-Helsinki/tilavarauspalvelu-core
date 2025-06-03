/// This file contains the search query for reservation units
/// e.g. the common search pages (both seasonal and single)
import {
  filterNonNullable,
  getLocalizationLang,
  ignoreMaybeArray,
  toNumber,
} from "common/src/helpers";
import { type LocalizationLanguages } from "common/src/urlBuilder";
import {
  EquipmentOrderingChoices,
  OptionsDocument,
  type OptionsQuery,
  OptionsQueryVariables,
  PurposeOrderingChoices,
  type QueryReservationUnitsArgs,
  ReservationKind,
  ReservationUnitOrderingChoices,
  ReservationUnitTypeOrderingChoices,
  UnitOrderingChoices,
} from "@gql/gql-types";
import {
  convertLanguageCode,
  getTranslationSafe,
  toApiDate,
} from "common/src/common/util";
import { fromUIDate } from "./util";
import { startOfDay } from "date-fns";
import { SEARCH_PAGING_LIMIT } from "./const";
import { gql, type ApolloClient } from "@apollo/client";
import { type ReadonlyURLSearchParams } from "next/navigation";
import { transformAccessTypeSafe } from "common/src/conversion";

function transformOrderByName(desc: boolean, language: LocalizationLanguages) {
  if (language === "fi") {
    return desc
      ? ReservationUnitOrderingChoices.NameFiDesc
      : ReservationUnitOrderingChoices.NameFiAsc;
  }
  if (language === "sv") {
    return desc
      ? ReservationUnitOrderingChoices.NameSvDesc
      : ReservationUnitOrderingChoices.NameSvAsc;
  }
  return desc
    ? ReservationUnitOrderingChoices.NameEnDesc
    : ReservationUnitOrderingChoices.NameEnAsc;
}

function transformOrderByUnitName(
  desc: boolean,
  language: LocalizationLanguages
) {
  if (language === "fi") {
    return desc
      ? ReservationUnitOrderingChoices.UnitNameFiDesc
      : ReservationUnitOrderingChoices.UnitNameFiAsc;
  }
  if (language === "sv") {
    return desc
      ? ReservationUnitOrderingChoices.UnitNameSvDesc
      : ReservationUnitOrderingChoices.UnitNameSvAsc;
  }
  return desc
    ? ReservationUnitOrderingChoices.UnitNameEnDesc
    : ReservationUnitOrderingChoices.UnitNameEnAsc;
}

function transformOrderByTypeRank(
  desc: boolean,
  _language: LocalizationLanguages
) {
  return desc
    ? ReservationUnitOrderingChoices.TypeRankDesc
    : ReservationUnitOrderingChoices.TypeRankAsc;
}

function transformOrderBy(
  orderBy: string | null,
  desc: boolean,
  language: LocalizationLanguages
): ReservationUnitOrderingChoices | null {
  switch (orderBy) {
    case "name":
      return transformOrderByName(desc, language);
    case "unitName":
      return transformOrderByUnitName(desc, language);
    case "typeRank":
      return transformOrderByTypeRank(desc, language);
    default:
      return null;
  }
}

/// Defaults to name sorting
function transformSortString(
  orderBy: string | null,
  language: string,
  desc: boolean
): ReservationUnitOrderingChoices[] {
  const lang = getLocalizationLang(language);
  const transformed =
    transformOrderBy(orderBy ?? "name", desc, lang) ??
    transformOrderByName(false, lang);
  // NOTE a weird backend issue that requires two orderBy params (otherwise 2nd+ page is sometimes incorrect)
  const sec = desc
    ? ReservationUnitOrderingChoices.PkDesc
    : ReservationUnitOrderingChoices.PkAsc;
  return [transformed, sec];
}

function filterEmpty(str: string | null | undefined): string | null {
  return str && str.trim() !== "" ? str : null;
}

type ProcessVariablesParams =
  | {
      values: ReadonlyURLSearchParams;
      language: string;
      kind: ReservationKind.Direct;
    }
  | {
      values: ReadonlyURLSearchParams;
      language: string;
      kind: ReservationKind.Season;
      applicationRound: number;
      reservationPeriodBegin?: string;
      reservationPeriodEnd?: string;
    };

export function processVariables({
  values,
  language,
  kind,
  ...rest
}: ProcessVariablesParams): QueryReservationUnitsArgs {
  const sortCriteria = values.getAll("sort");
  const desc = values.getAll("order").includes("desc");
  const orderBy = transformSortString(
    ignoreMaybeArray(sortCriteria),
    language,
    desc
  );

  const today = startOfDay(new Date());
  const startDate = fromUIDate(
    ignoreMaybeArray(values.getAll("startDate")) ?? ""
  );
  const reservableDateStart =
    startDate && startDate >= today ? toApiDate(startDate) : null;
  const endDate = fromUIDate(ignoreMaybeArray(values.getAll("endDate")) ?? "");
  const reservableDateEnd =
    endDate && endDate >= today ? toApiDate(endDate) : null;

  const dur = toNumber(ignoreMaybeArray(values.getAll("duration")));
  const duration = dur != null && dur > 0 ? dur : null;
  const isSeasonal = kind === ReservationKind.Season;
  const textSearch = values.get("textSearch");
  const personsAllowed = toNumber(values.get("personsAllowed"));
  const purposes = mapParamToNumber(values.getAll("purposes"), 1);
  const unit = mapParamToNumber(values.getAll("units"), 1);
  const reservationUnitTypes = mapParamToNumber(
    values.getAll("reservationUnitTypes"),
    1
  );
  const equipments = mapParamToNumber(values.getAll("equipments"), 1);
  const showOnlyReservable =
    ignoreMaybeArray(values.getAll("showOnlyReservable")) !== "false";
  const applicationRound =
    "applicationRound" in rest && isSeasonal ? rest.applicationRound : null;
  const reservationPeriodBegin =
    "reservationPeriodBegin" in rest && isSeasonal
      ? rest.reservationPeriodBegin
      : null;
  const reservationPeriodEnd =
    "reservationPeriodEnd" in rest && isSeasonal
      ? rest.reservationPeriodEnd
      : null;
  const timeEnd = ignoreMaybeArray(values.getAll("timeEnd"));
  const timeBegin = ignoreMaybeArray(values.getAll("timeBegin"));
  const accessType = values.getAll("accessTypes").map(transformAccessTypeSafe);

  return {
    textSearch: filterEmpty(textSearch),
    purposes,
    unit,
    reservationUnitType: reservationUnitTypes,
    equipments,
    accessType,
    accessTypeBeginDate: isSeasonal
      ? reservationPeriodBegin
      : reservableDateStart,
    accessTypeEndDate: isSeasonal ? reservationPeriodEnd : reservableDateEnd,
    ...(startDate != null || isSeasonal
      ? isSeasonal
        ? { reservableDateStart: reservationPeriodBegin } // Used to find effectiveAccessType in /recurring/[id] page
        : {
            reservableDateStart,
          }
      : {}),
    reservableDateEnd: filterEmpty(reservableDateEnd),
    reservableTimeStart: filterEmpty(timeBegin),
    reservableTimeEnd: filterEmpty(timeEnd),
    reservableMinimumDurationMinutes: duration,
    ...(!isSeasonal && showOnlyReservable
      ? {
          showOnlyReservable: true,
        }
      : {}),
    ...(isSeasonal && applicationRound != null && applicationRound > 0
      ? { applicationRound: [applicationRound] }
      : {}),
    personsAllowed,
    first: SEARCH_PAGING_LIMIT,
    orderBy,
    isDraft: false,
    isVisible: true,
    reservationKind: kind,
  };
}

export function mapParamToNumber(param: string[], min?: number): number[] {
  const numbers = param.map(Number).filter(Number.isInteger);
  return min != null ? numbers.filter((n) => n >= min) : numbers;
}

type OptionT = Readonly<{ value: number; label: string }>;
export type OptionsT = Readonly<{
  units: Readonly<OptionT[]>;
  equipments: Readonly<OptionT[]>;
  purposes: Readonly<OptionT[]>;
  reservationUnitTypes: Readonly<OptionT[]>;
  ageGroups: Readonly<OptionT[]>;
  cities: Readonly<OptionT[]>;
}>;

export async function getSearchOptions(
  apolloClient: ApolloClient<unknown>,
  page: "seasonal" | "direct",
  locale: string
): Promise<OptionsT> {
  const lang = convertLanguageCode(locale);
  const { data: optionsData } = await apolloClient.query<
    OptionsQuery,
    OptionsQueryVariables
  >({
    query: OptionsDocument,
    variables: {
      reservationUnitTypesOrderBy: ReservationUnitTypeOrderingChoices.RankAsc,
      purposesOrderBy: PurposeOrderingChoices.RankAsc,
      unitsOrderBy: UnitOrderingChoices.NameFiAsc,
      equipmentsOrderBy: EquipmentOrderingChoices.CategoryRankAsc,
      ...(page === "direct" ? { onlyDirectBookable: true } : {}),
      ...(page === "seasonal" ? { onlySeasonalBookable: true } : {}),
    },
  });

  const reservationUnitTypes = filterNonNullable(
    optionsData?.reservationUnitTypes?.edges?.map((edge) => edge?.node)
  ).map((n) => ({
    value: n.pk ?? 0,
    label: getTranslationSafe(n, "name", lang),
  }));
  const purposes = filterNonNullable(
    optionsData?.purposes?.edges?.map((edge) => edge?.node)
  ).map((n) => ({
    value: n.pk ?? 0,
    label: getTranslationSafe(n, "name", lang),
  }));

  const equipments = filterNonNullable(optionsData?.equipmentsAll).map((n) => ({
    value: n.pk ?? 0,
    label: getTranslationSafe(n, "name", lang),
  }));

  const units = filterNonNullable(optionsData?.unitsAll).map((node) => ({
    value: node.pk ?? 0,
    label: getTranslationSafe(node, "name", lang),
  }));
  const ageGroups = filterNonNullable(
    optionsData?.ageGroups?.edges?.map((edge) => edge?.node)
  ).map((n) => ({
    value: n.pk ?? 0,
    label: getTranslationSafe(n, "name", lang),
  }));
  const cities = filterNonNullable(
    optionsData?.cities?.edges?.map((edge) => edge?.node)
  ).map((n) => ({
    value: n.pk ?? 0,
    label: getTranslationSafe(n, "name", lang),
  }));

  return {
    units,
    equipments,
    purposes,
    reservationUnitTypes,
    ageGroups,
    cities,
  };
}

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
