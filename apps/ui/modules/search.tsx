/// This file contains the search query for reservation units
/// e.g. the common search pages (both seasonal and single)
import { filterNonNullable, getLocalizationLang, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { type LocalizationLanguages } from "common/src/urlBuilder";
import {
  EquipmentOrderSet,
  type Maybe,
  MunicipalityChoice,
  OptionsDocument,
  type OptionsQuery,
  type OptionsQueryVariables,
  PurposeOrderSet,
  ReservationKind,
  ReservationUnitOrderSet,
  ReservationUnitTypeOrderSet,
  type SearchReservationUnitsQueryVariables,
  UnitOrderSet,
} from "@gql/gql-types";
import { convertLanguageCode, getTranslationSafe, toApiDate } from "common/src/common/util";
import { fromUIDate } from "./util";
import { startOfDay } from "date-fns";
import { SEARCH_PAGING_LIMIT } from "./const";
import { type ApolloClient } from "@apollo/client";
import { type ReadonlyURLSearchParams } from "next/navigation";
import { transformAccessTypeSafe } from "common/src/conversion";

function transformOrderByName(desc: boolean, language: LocalizationLanguages) {
  if (language === "fi") {
    return desc ? ReservationUnitOrderSet.NameFiDesc : ReservationUnitOrderSet.NameFiAsc;
  }
  if (language === "sv") {
    return desc ? ReservationUnitOrderSet.NameSvDesc : ReservationUnitOrderSet.NameSvAsc;
  }
  return desc ? ReservationUnitOrderSet.NameEnDesc : ReservationUnitOrderSet.NameEnAsc;
}

function transformOrderByUnitName(desc: boolean, language: LocalizationLanguages) {
  if (language === "fi") {
    return desc ? ReservationUnitOrderSet.UnitNameFiDesc : ReservationUnitOrderSet.UnitNameFiAsc;
  }
  if (language === "sv") {
    return desc ? ReservationUnitOrderSet.UnitNameSvDesc : ReservationUnitOrderSet.UnitNameSvAsc;
  }
  return desc ? ReservationUnitOrderSet.UnitNameEnDesc : ReservationUnitOrderSet.UnitNameEnAsc;
}

function transformOrderByTypeRank(desc: boolean, _language: LocalizationLanguages) {
  return desc ? ReservationUnitOrderSet.TypeRankDesc : ReservationUnitOrderSet.TypeRankAsc;
}

function transformOrderBy(
  orderBy: string | null,
  desc: boolean,
  language: LocalizationLanguages
): ReservationUnitOrderSet | null {
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
): ReservationUnitOrderSet[] {
  const lang = getLocalizationLang(language);
  const transformed = transformOrderBy(orderBy ?? "name", desc, lang) ?? transformOrderByName(false, lang);
  // NOTE a weird backend issue that requires two orderBy params (otherwise 2nd+ page is sometimes incorrect)
  const sec = desc ? ReservationUnitOrderSet.PkDesc : ReservationUnitOrderSet.PkAsc;
  return [transformed, sec];
}

function filterEmpty(str: string | null | undefined, fallback: undefined | null = null): string | typeof fallback {
  return str && str.trim() !== "" ? str : fallback;
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
}: ProcessVariablesParams): SearchReservationUnitsQueryVariables {
  const sortCriteria = values.getAll("sort");
  const desc = values.getAll("order").includes("desc");
  const orderBy = transformSortString(ignoreMaybeArray(sortCriteria), language, desc);

  const today = startOfDay(new Date());
  const startDate = fromUIDate(ignoreMaybeArray(values.getAll("startDate")) ?? "");
  const reservableDateStart = startDate && startDate >= today ? toApiDate(startDate) : null;
  const endDate = fromUIDate(ignoreMaybeArray(values.getAll("endDate")) ?? "");
  const reservableDateEnd = endDate && endDate >= today ? toApiDate(endDate) : null;

  const dur = toNumber(ignoreMaybeArray(values.getAll("duration")));
  const duration = dur != null && dur > 0 ? dur : undefined;
  const isSeasonal = kind === ReservationKind.Season;
  const textSearch = values.get("textSearch");
  const personsAllowed = toNumber(values.get("personsAllowed")) ?? undefined;
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
  const accessType = filterNonNullable(values.getAll("accessTypes").map(transformAccessTypeSafe));

  return {
    textSearch: filterEmpty(textSearch) ?? "",
    // API error (zero results) when purposes is empty
    purposes: purposes.length > 0 ? purposes : undefined,
    unit: unit.length > 0 ? unit : undefined,
    reservationUnitType: reservationUnitTypes.length > 0 ? reservationUnitTypes : undefined,
    equipments: equipments.length > 0 ? equipments : undefined,
    accessType: accessType.length > 0 ? {
      accessTypes: accessType,
      accessTypeBeginDate: isSeasonal ? reservationPeriodBeginDate ?? undefined : reservableDateStart ?? undefined,
      accessTypeEndDate: isSeasonal ? reservationPeriodEndDate ?? undefined : reservableDateEnd ?? undefined,
    } : undefined,
    ...(startDate != null || isSeasonal
      ? isSeasonal
        ? { reservableDateStart: reservationPeriodBeginDate ?? undefined } // Used to find effectiveAccessType in /recurring/[id] page
        : {
            reservableDateStart,
          }
      : {
        reservableDateStart: undefined,
      }),
    applicationRound: isSeasonal && applicationRound != null && applicationRound > 0 ? [applicationRound] : undefined,
    personsAllowed,
    // FIXME API error (zero results) when isDraft is false
    isDraft: true, // false,
    isVisible: true,
    reservationKind: kind,
    showOnlyReservable: !isSeasonal && showOnlyReservable,
    reservableDateEnd: filterEmpty(reservableDateEnd) ?? undefined,
    reservableTimeStart: filterEmpty(timeBegin) ?? undefined,
    reservableTimeEnd: filterEmpty(timeEnd) ?? undefined,
    reservableMinimumDurationMinutes: duration ,
    first: SEARCH_PAGING_LIMIT,
    orderBy,
    before: undefined,
    after: undefined,
    pk: undefined,
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
      reservationUnitTypesOrderBy: ReservationUnitTypeOrderSet.RankAsc,
      reservationPurposesOrderBy: [],
      purposesOrderBy: PurposeOrderSet.RankAsc,
      unitsOrderBy: UnitOrderSet.NameFiAsc,
      equipmentsOrderBy: EquipmentOrderSet.CategoryRankAsc,
      onlyDirectBookable: page === "direct",
      onlySeasonalBookable: page === "seasonal",
    },
  });

  const reservationUnitTypes = filterNonNullable(optionsData?.allReservationUnitTypes).map((n) => translateOption(n, lang));
  const purposes = filterNonNullable(optionsData?.allPurposes.map((n) => translateOption(n, lang)));

  const equipments = filterNonNullable(optionsData?.allEquipments).map((n) => translateOption(n, lang));
  const units = filterNonNullable(optionsData?.allUnits).map((n) => translateOption(n, lang));
  const ageGroups = sortAgeGroups(optionsData?.allAgeGroups).map((n) => ({
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

type AgeGroup = NonNullable<NonNullable<OptionsQuery["allAgeGroups"]>[0]>;
function sortAgeGroups(ageGroups: Readonly<AgeGroup[]>): NonNullable<AgeGroup>[] {
  return filterNonNullable(ageGroups).sort((a, b) => {
    const order = ["1-99"];
    const strA = `${a.minimum || ""}-${a.maximum || ""}`;
    const strB = `${b.minimum || ""}-${b.maximum || ""}`;

    return order.includes(strA) || order.includes(strB)
      ? order.indexOf(strA) - order.indexOf(strB)
      : a.minimum - b.minimum;
  });
}
