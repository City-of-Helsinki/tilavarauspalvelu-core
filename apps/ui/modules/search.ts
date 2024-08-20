/// This file contains the search query for reservation units
/// e.g. the common search pages (both seasonal and single)
import {
  type LocalizationLanguages,
  getLocalizationLang,
} from "common/src/helpers";
import {
  type QueryReservationUnitsArgs,
  ReservationKind,
  ReservationUnitOrderingChoices,
  type OptionsQuery,
  OptionsDocument,
  type SearchFormParamsUnitQueryVariables,
  type SearchFormParamsUnitQuery,
  SearchFormParamsUnitDocument,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import {
  convertLanguageCode,
  getTranslationSafe,
  toApiDate,
} from "common/src/common/util";
import { type ParsedUrlQuery } from "node:querystring";
import { fromUIDate } from "./util";
import { startOfDay } from "date-fns";
import { SEARCH_PAGING_LIMIT } from "./const";
import { type ApolloClient } from "@apollo/client";

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
  orderBy: string,
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

function ignoreMaybeArray<T>(value: T | T[]): T {
  return Array.isArray(value) ? value[0] : value;
}

export function processVariables(
  values: ParsedUrlQuery,
  language: string,
  reservationKind: ReservationKind
): QueryReservationUnitsArgs {
  const sortCriteria = values.sort;
  const desc = values.order === "desc";
  const orderBy = sortCriteria
    ? transformSortString(ignoreMaybeArray(sortCriteria), language, desc)
    : null;
  const startDate = fromUIDate(ignoreMaybeArray(values.startDate ?? ""));
  const endDate = fromUIDate(ignoreMaybeArray(values.endDate ?? ""));
  const today = startOfDay(new Date());

  const dur =
    values.duration != null ? Number(ignoreMaybeArray(values.duration)) : null;
  const duration = dur != null && dur > 0 ? dur : null;
  const isSeasonal = reservationKind === ReservationKind.Season;
  return {
    ...(values.textSearch != null
      ? {
          textSearch: ignoreMaybeArray(values.textSearch),
        }
      : {}),
    ...(values.minPersons != null
      ? {
          minPersons: parseInt(ignoreMaybeArray(values.minPersons), 10),
        }
      : {}),
    ...(values.maxPersons != null
      ? {
          maxPersons: parseInt(ignoreMaybeArray(values.maxPersons), 10),
        }
      : {}),
    ...(values.purposes != null
      ? {
          purposes: paramToIntegers(values.purposes),
        }
      : {}),
    ...(values.unit != null
      ? {
          unit: paramToIntegers(values.unit),
        }
      : {}),
    ...(values.reservationUnitTypes != null
      ? {
          reservationUnitType: paramToIntegers(values.reservationUnitTypes),
        }
      : {}),
    ...(values.equipments != null
      ? {
          equipments: paramToIntegers(values.equipments),
        }
      : {}),
    ...(values.startDate != null
      ? {
          reservableDateStart:
            startDate && startDate >= today ? toApiDate(startDate) : null,
        }
      : {}),
    ...(values.endDate != null
      ? {
          reservableDateEnd:
            endDate && endDate >= today ? toApiDate(endDate) : null,
        }
      : {}),
    ...(values.timeBegin != null
      ? {
          reservableTimeStart: ignoreMaybeArray(values.timeBegin),
        }
      : {}),
    ...(values.timeBegin != null
      ? {
          reservableTimeEnd: ignoreMaybeArray(values.timeEnd),
        }
      : {}),
    ...(duration != null
      ? {
          reservableMinimumDurationMinutes: duration.toString(),
        }
      : {}),
    ...(!isSeasonal && ignoreMaybeArray(values.showOnlyReservable) !== "false"
      ? {
          showOnlyReservable: true,
        }
      : {}),
    ...(values.applicationRound != null && isSeasonal
      ? { applicationRound: paramToIntegers(values.applicationRound) }
      : {}),
    first: SEARCH_PAGING_LIMIT,
    orderBy,
    isDraft: false,
    isVisible: true,
    reservationKind,
  };
}

export function mapSingleParamToFormValue(
  param: string | string[] | undefined
): string | null {
  if (param == null) return null;
  if (param === "") return null;
  if (Array.isArray(param)) return param.join(",");
  return param;
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

export function mapQueryParamToNumber(
  param: string | string[] | undefined
): number | null {
  if (param == null) return null;
  if (param === "") return null;
  if (Array.isArray(param)) {
    const v = Number(param[0]);
    if (Number.isNaN(v)) {
      return null;
    }
    return v;
  }
  if (Number.isNaN(Number(param))) {
    return null;
  }
  return Number(param);
}

export function mapQueryParamToNumberArray(
  param: string | string[] | undefined
): number[] {
  if (param == null) return [];
  if (param === "") return [];
  if (Array.isArray(param)) {
    return param.map(Number).filter(Number.isInteger);
  }
  const v = Number(param);
  if (Number.isNaN(v)) {
    return [];
  }
  return [v];
}

export async function getSearchOptions(
  apolloClient: ApolloClient<unknown>,
  page: "seasonal" | "direct",
  locale: string
) {
  const lang = convertLanguageCode(locale ?? "");
  const { data: optionsData } = await apolloClient.query<OptionsQuery>({
    query: OptionsDocument,
  });
  const reservationUnitTypes = filterNonNullable(
    optionsData?.reservationUnitTypes?.edges?.map((edge) => edge?.node)
  );
  const purposes = filterNonNullable(
    optionsData?.purposes?.edges?.map((edge) => edge?.node)
  );
  const equipments = filterNonNullable(
    optionsData?.equipments?.edges?.map((edge) => edge?.node)
  );

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
      ...(page === "direct" ? { onlyDirectBookable: true } : {}),
      ...(page === "seasonal" ? { onlySeasonalBookable: true } : {}),
    },
  });
  const unitOptions = filterNonNullable(
    unitData?.units?.edges?.map((e) => e?.node)
  ).map((node) => ({
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
