/// This file contains the search query for reservation units
/// e.g. the common search pages (both seasonal and single)
import { filterNonNullable, getLocalizationLang, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { type LocalizationLanguages } from "common/src/urlBuilder";
import {
  EquipmentOrderingChoices,
  type Maybe,
  MunicipalityChoice,
  OptionsDocument,
  type OptionsQuery,
  type OptionsQueryVariables,
  PurposeOrderingChoices,
  type QueryReservationUnitsArgs,
  ReservationKind,
  ReservationUnitOrderingChoices,
  ReservationUnitTypeOrderingChoices,
  UnitOrderingChoices,
} from "@gql/gql-types";
import { convertLanguageCode, getTranslationSafe, toApiDate } from "common/src/common/util";
import { fromUIDate } from "./util";
import { startOfDay } from "date-fns";
import { SEARCH_PAGING_LIMIT } from "./const";
import { gql, type ApolloClient } from "@apollo/client";
import { type ReadonlyURLSearchParams } from "next/navigation";
import { transformAccessTypeSafe } from "common/src/conversion";

function transformOrderByName(desc: boolean, language: LocalizationLanguages) {
  if (language === "fi") {
    return desc ? ReservationUnitOrderingChoices.NameFiDesc : ReservationUnitOrderingChoices.NameFiAsc;
  }
  if (language === "sv") {
    return desc ? ReservationUnitOrderingChoices.NameSvDesc : ReservationUnitOrderingChoices.NameSvAsc;
  }
  return desc ? ReservationUnitOrderingChoices.NameEnDesc : ReservationUnitOrderingChoices.NameEnAsc;
}

function transformOrderByUnitName(desc: boolean, language: LocalizationLanguages) {
  if (language === "fi") {
    return desc ? ReservationUnitOrderingChoices.UnitNameFiDesc : ReservationUnitOrderingChoices.UnitNameFiAsc;
  }
  if (language === "sv") {
    return desc ? ReservationUnitOrderingChoices.UnitNameSvDesc : ReservationUnitOrderingChoices.UnitNameSvAsc;
  }
  return desc ? ReservationUnitOrderingChoices.UnitNameEnDesc : ReservationUnitOrderingChoices.UnitNameEnAsc;
}

function transformOrderByTypeRank(desc: boolean, _language: LocalizationLanguages) {
  return desc ? ReservationUnitOrderingChoices.TypeRankDesc : ReservationUnitOrderingChoices.TypeRankAsc;
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
  const transformed = transformOrderBy(orderBy ?? "name", desc, lang) ?? transformOrderByName(false, lang);
  // NOTE a weird backend issue that requires two orderBy params (otherwise 2nd+ page is sometimes incorrect)
  const sec = desc ? ReservationUnitOrderingChoices.PkDesc : ReservationUnitOrderingChoices.PkAsc;
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
      reservationPeriodBeginDate?: string;
      reservationPeriodEndDate?: string;
    };

export function processVariables({
  values,
  language,
  kind,
  ...rest
}: ProcessVariablesParams): QueryReservationUnitsArgs {
  const sortCriteria = values.getAll("sort");
  const desc = values.getAll("order").includes("desc");
  const orderBy = transformSortString(ignoreMaybeArray(sortCriteria), language, desc);

  const today = startOfDay(new Date());
  const startDate = fromUIDate(ignoreMaybeArray(values.getAll("startDate")) ?? "");
  const reservableDateStart = startDate && startDate >= today ? toApiDate(startDate) : null;
  const endDate = fromUIDate(ignoreMaybeArray(values.getAll("endDate")) ?? "");
  const reservableDateEnd = endDate && endDate >= today ? toApiDate(endDate) : null;

  const dur = toNumber(ignoreMaybeArray(values.getAll("duration")));
  const duration = dur != null && dur > 0 ? dur : null;
  const isSeasonal = kind === ReservationKind.Season;
  const textSearch = values.get("textSearch");
  const personsAllowed = toNumber(values.get("personsAllowed"));
  const purposes = mapParamToNumber(values.getAll("purposes"), 1);
  const unit = mapParamToNumber(values.getAll("units"), 1);
  const reservationUnitTypes = mapParamToNumber(values.getAll("reservationUnitTypes"), 1);
  const equipments = mapParamToNumber(values.getAll("equipments"), 1);
  const showOnlyReservable = ignoreMaybeArray(values.getAll("showOnlyReservable")) !== "false";
  const applicationRound = "applicationRound" in rest && isSeasonal ? rest.applicationRound : null;
  const reservationPeriodBeginDate =
    "reservationPeriodBeginDate" in rest && isSeasonal ? rest.reservationPeriodBeginDate : null;
  const reservationPeriodEndDate =
    "reservationPeriodEndDate" in rest && isSeasonal ? rest.reservationPeriodEndDate : null;
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
    accessTypeBeginDate: isSeasonal ? reservationPeriodBeginDate : reservableDateStart,
    accessTypeEndDate: isSeasonal ? reservationPeriodEndDate : reservableDateEnd,
    ...(startDate != null || isSeasonal
      ? isSeasonal
        ? { reservableDateStart: reservationPeriodBeginDate } // Used to find effectiveAccessType in /recurring/[id] page
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
    ...(isSeasonal && applicationRound != null && applicationRound > 0 ? { applicationRound: [applicationRound] } : {}),
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

export function translateOption(
  val: {
    pk: Maybe<number>;
    nameFi: Maybe<string>;
    nameEn: Maybe<string>;
    nameSv: Maybe<string>;
  },
  lang: LocalizationLanguages
): OptionT {
  return {
    value: val.pk ?? 0,
    label: getTranslationSafe(val, "name", lang),
  };
}

type OptionT = Readonly<{ value: number; label: string }>;
export type OptionsT = Readonly<{
  units: Readonly<OptionT[]>;
  equipments: Readonly<OptionT[]>;
  purposes: Readonly<OptionT[]>;
  reservationUnitTypes: Readonly<OptionT[]>;
  ageGroups: Readonly<OptionT[]>;
  municipalities: Readonly<{ value: MunicipalityChoice; label: string }[]>;
}>;

export async function getSearchOptions(
  apolloClient: ApolloClient<unknown>,
  page: "seasonal" | "direct",
  locale: string
): Promise<OptionsT> {
  const lang = convertLanguageCode(locale);
  const { data: optionsData } = await apolloClient.query<OptionsQuery, OptionsQueryVariables>({
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
  ).map((n) => translateOption(n, lang));
  const purposes = filterNonNullable(optionsData?.purposes?.edges?.map((edge) => edge?.node)).map((n) =>
    translateOption(n, lang)
  );

  const equipments = filterNonNullable(optionsData?.equipmentsAll).map((n) => translateOption(n, lang));
  const units = filterNonNullable(optionsData?.unitsAll).map((n) => translateOption(n, lang));
  const ageGroups = sortAgeGroups(optionsData?.ageGroups?.edges?.map((edge) => edge?.node ?? null) ?? []).map((n) => ({
    value: n.pk ?? 0,
    label: `${n.minimum || ""} - ${n.maximum || ""}`,
  }));

  const municipalities = Object.values(MunicipalityChoice).map((value) => ({
    label: value as string, // TODO: Translate this
    value: value,
  }));

  return {
    units,
    equipments,
    purposes,
    reservationUnitTypes,
    ageGroups,
    municipalities,
  };
}

type AgeGroup = NonNullable<NonNullable<OptionsQuery["ageGroups"]>["edges"][0]>["node"];
function sortAgeGroups(ageGroups: AgeGroup[]): NonNullable<AgeGroup>[] {
  return filterNonNullable(ageGroups).sort((a, b) => {
    const order = ["1-99"];
    const strA = `${a.minimum || ""}-${a.maximum || ""}`;
    const strB = `${b.minimum || ""}-${b.maximum || ""}`;

    return order.includes(strA) || order.includes(strB)
      ? order.indexOf(strA) - order.indexOf(strB)
      : a.minimum - b.minimum;
  });
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
