/// This file contains the search query for reservation units
/// e.g. the common search pages (both seasonal and single)
import {
  filterNonNullable,
  getLocalizationLang,
  ignoreMaybeArray,
  type LocalizationLanguages,
  toNumber,
} from "common/src/helpers";
import {
  AccessType,
  EquipmentOrderingChoices,
  OptionsDocument,
  type OptionsQuery,
  PurposeOrderingChoices,
  type QueryReservationUnitsArgs,
  ReservationKind,
  ReservationUnitOrderingChoices,
  ReservationUnitTypeOrderingChoices,
  SearchFormParamsUnitDocument,
  SearchFormParamsUnitQuery,
  SearchFormParamsUnitQueryVariables,
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
import { type ApolloClient } from "@apollo/client";
import { type ReadonlyURLSearchParams } from "next/navigation";

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

function transformAccessTypeSafe(t: string): AccessType | null {
  switch (t) {
    case AccessType.AccessCode:
      return AccessType.AccessCode;
    case AccessType.PhysicalKey:
      return AccessType.PhysicalKey;
    case AccessType.OpenedByStaff:
      return AccessType.OpenedByStaff;
    case AccessType.Unrestricted:
      return AccessType.Unrestricted;
    default:
      return null;
  }
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

// known issue this can send invalid values to backend (i.e. -1 or 0, or a pk that has been deleted)
function paramToIntegers(param: string | string[]): number[] {
  // Multiple params are arrays (i.e. key=value1&key=value2)
  if (Array.isArray(param)) {
    return param.map(Number).filter(Number.isInteger);
  }
  // Handle old string encoded values (i.e. key=value1,value2)
  if (param.includes(",")) {
    return param.split(",").map(Number).filter(Number.isInteger);
  }
  // Nextjs query converter makes single values into strings
  // versus using URLSearchParams with getAll (which would return an array of one).
  // and JS is silly about empty strings getting coerced to 0 and not NaN
  const num = param !== "" ? Number(param) : Number.NaN;
  return Number.isInteger(num) ? [num] : [];
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
      reservationPeriodBegin: string;
      reservationPeriodEnd: string;
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

  const dur = Number(ignoreMaybeArray(values.getAll("duration")));
  const duration = dur != null && dur > 0 ? dur : null;
  const isSeasonal = kind === ReservationKind.Season;
  const textSearch = ignoreMaybeArray(values.getAll("textSearch"));
  const minPersons = toNumber(ignoreMaybeArray(values.getAll("minPersons")));
  const maxPersons = toNumber(ignoreMaybeArray(values.getAll("maxPersons")));
  const purposes = paramToIntegers(values.getAll("purposes"));
  const unit = paramToIntegers(values.getAll("unit"));
  const reservationUnitTypes = paramToIntegers(
    values.getAll("reservationUnitTypes")
  );
  const equipments = paramToIntegers(values.getAll("equipments"));
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
  const accessType = values.getAll("accessType").map(transformAccessTypeSafe);
  return {
    ...(textSearch !== ""
      ? {
          textSearch,
        }
      : {}),
    ...(minPersons != null && minPersons >= 0
      ? {
          minPersons,
        }
      : {}),
    ...(maxPersons != null && maxPersons >= 0
      ? {
          maxPersons,
        }
      : {}),
    purposes,
    unit,
    reservationUnitType: reservationUnitTypes,
    equipments,
    accessType,
    accessTypeBeginDate: isSeasonal
      ? reservationPeriodBegin
      : reservableDateStart,
    accessTypeEndDate: isSeasonal ? reservationPeriodEnd : reservableDateEnd,
    ...(startDate != null
      ? {
          reservableDateStart,
        }
      : {}),
    ...(endDate != null
      ? {
          reservableDateEnd,
        }
      : {}),
    ...(timeBegin != null && timeBegin !== ""
      ? {
          reservableTimeStart: timeBegin,
        }
      : {}),
    ...(timeEnd != null && timeEnd !== ""
      ? {
          reservableTimeEnd: timeEnd,
        }
      : {}),
    ...(duration != null
      ? {
          reservableMinimumDurationMinutes: duration.toString(),
        }
      : {}),
    ...(!isSeasonal && showOnlyReservable
      ? {
          showOnlyReservable: true,
        }
      : {}),
    ...(isSeasonal && applicationRound != null && applicationRound > 0
      ? { applicationRound: [applicationRound] }
      : {}),
    first: SEARCH_PAGING_LIMIT,
    orderBy,
    isDraft: false,
    isVisible: true,
    reservationKind: kind,
  };
}

// default to false if the param is present but not true, null if not present
export function mapSingleBooleanParamToFormValue(
  param: string | string[] | undefined
): boolean | null {
  if (param == null) return null;
  if (param === "") return null;
  if (Array.isArray(param)) {
    const found = param.find((p) => p === "true");
    if (found != null) return true;
    if (param.length > 1) return false;
    return null;
  }
  return param === "true";
}

export function mapParamToNumber(param: string[], min?: number): number[] {
  const numbers = param.map(Number).filter(Number.isInteger);
  return min != null ? numbers.filter((n) => n >= min) : numbers;
}

export async function getSearchOptions(
  apolloClient: ApolloClient<unknown>,
  page: "seasonal" | "direct",
  locale: string
) {
  const lang = convertLanguageCode(locale ?? "");
  const { data: optionsData } = await apolloClient.query<OptionsQuery>({
    query: OptionsDocument,
    variables: {
      reservationUnitTypesOrderBy: ReservationUnitTypeOrderingChoices.RankAsc,
      purposesOrderBy: PurposeOrderingChoices.RankAsc,
      unitsOrderBy: UnitOrderingChoices.NameFiAsc,
      equipmentsOrderBy: EquipmentOrderingChoices.CategoryRankAsc,
    },
  });

  const reservationUnitTypes = filterNonNullable(
    optionsData?.reservationUnitTypes?.edges?.map((edge) => edge?.node)
  );
  const purposes = filterNonNullable(
    optionsData?.purposes?.edges?.map((edge) => edge?.node)
  );
  const equipments = filterNonNullable(optionsData?.equipmentsAll);

  const reservationUnitTypeOptions = reservationUnitTypes.map((n) => ({
    value: n.pk ?? 0,
    label: getTranslationSafe(n, "name", lang),
  }));
  const purposeOptions = purposes.map((n) => ({
    value: n.pk ?? 0,
    label: getTranslationSafe(n, "name", lang),
  }));
  const equipmentsOptions = equipments.map((n) => ({
    value: n.pk ?? 0,
    label: getTranslationSafe(n, "name", lang),
  }));
  const { data: unitData } = await apolloClient.query<
    SearchFormParamsUnitQuery,
    SearchFormParamsUnitQueryVariables
  >({
    query: SearchFormParamsUnitDocument,
    variables: {
      publishedReservationUnits: true,
      orderBy: UnitOrderingChoices.NameFiAsc,
      ...(page === "direct" ? { onlyDirectBookable: true } : {}),
      ...(page === "seasonal" ? { onlySeasonalBookable: true } : {}),
    },
  });
  const unitOptions = filterNonNullable(unitData?.unitsAll).map((node) => ({
    value: node.pk ?? 0,
    label: getTranslationSafe(node, "name", lang),
  }));

  return {
    unitOptions,
    equipmentsOptions,
    purposeOptions,
    reservationUnitTypeOptions,
  };
}
