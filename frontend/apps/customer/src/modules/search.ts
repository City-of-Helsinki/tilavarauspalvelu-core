/// This file contains the search query for reservation units
/// e.g. the common search pages (both seasonal and single)
import { gql, type ApolloClient } from "@apollo/client";
import { startOfDay } from "date-fns";
import { type ReadonlyURLSearchParams } from "next/navigation";
import { transformAccessTypeSafe } from "ui/src/modules/conversion";
import { parseUIDate, formatApiDate } from "ui/src/modules/date-utils";
import {
  filterEmptyArray,
  filterNonNullable,
  getLocalizationLang,
  ignoreMaybeArray,
  mapParamToInteger,
  toNumber,
} from "ui/src/modules/helpers";
import { type OptionsListT, type OptionT } from "ui/src/modules/search";
import { type LocalizationLanguages } from "ui/src/modules/urlBuilder";
import { getTranslation } from "ui/src/modules/util";
import {
  EquipmentOrderingChoices,
  IntendedUseOrderingChoices,
  type Maybe,
  MunicipalityChoice,
  OptionsDocument,
  type OptionsQuery,
  type OptionsQueryVariables,
  type QueryReservationUnitsArgs,
  ReservationKind,
  ReservationUnitOrderingChoices,
  ReservationUnitTypeOrderingChoices,
  UnitOrderingChoices,
} from "@gql/gql-types";
import { SEARCH_PAGING_LIMIT } from "./const";

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

function filterEmpty<T>(val: T | null | undefined): T | undefined {
  if (val == null) {
    return undefined;
  }
  if (typeof val === "string") {
    return val.trim() !== "" ? val : undefined;
  }
  return val;
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

  const dur = toNumber(ignoreMaybeArray(values.getAll("duration")));
  const duration = dur != null && dur > 0 ? dur : undefined;
  const isSeasonal = kind === ReservationKind.Season;
  const textSearch = filterEmpty(values.get("textSearch"));
  const personsAllowed = filterEmpty(toNumber(values.get("personsAllowed")));
  const intendedUses = filterEmptyArray(mapParamToInteger(values.getAll("intendedUses"), 1));
  const unit = filterEmptyArray(mapParamToInteger(values.getAll("units"), 1));
  const reservationUnitTypes = filterEmptyArray(mapParamToInteger(values.getAll("reservationUnitTypes"), 1));
  const equipments = filterEmptyArray(mapParamToInteger(values.getAll("equipments"), 1));
  const showOnlyReservable = ignoreMaybeArray(values.getAll("showOnlyReservable")) !== "false";
  const applicationRound = "applicationRound" in rest && isSeasonal ? rest.applicationRound : undefined;

  const startDate = parseUIDate(ignoreMaybeArray(values.getAll("startDate")) ?? "");
  const endDate = parseUIDate(ignoreMaybeArray(values.getAll("endDate")) ?? "");
  const reservableDateStartCleaned = startDate && startDate >= today ? formatApiDate(startDate) : undefined;
  const reservableDateEndCleaned = endDate && endDate >= today ? formatApiDate(endDate) : undefined;
  const reservableDateStart = filterEmpty(reservableDateStartCleaned);
  const reservableDateEnd = filterEmpty(reservableDateEndCleaned);
  const timeEnd = filterEmpty(ignoreMaybeArray(values.getAll("timeEnd")));
  const timeBegin = filterEmpty(ignoreMaybeArray(values.getAll("timeBegin")));
  const accessType = filterEmptyArray(filterNonNullable(values.getAll("accessTypes").map(transformAccessTypeSafe)));

  return {
    textSearch: filterEmpty(textSearch),
    intendedUses,
    unit,
    reservationUnitType: reservationUnitTypes,
    equipments,
    accessType,
    accessTypeBeginDate: filterEmpty(isSeasonal ? undefined : reservableDateStart),
    accessTypeEndDate: filterEmpty(isSeasonal ? undefined : reservableDateEnd),
    reservableDateStart: filterEmpty(reservableDateStart),
    reservableDateEnd: filterEmpty(reservableDateEnd),
    reservableTimeStart: filterEmpty(timeBegin),
    reservableTimeEnd: filterEmpty(timeEnd),
    reservableMinimumDurationMinutes: duration,
    showOnlyReservable: !isSeasonal && showOnlyReservable ? true : undefined,
    applicationRound: isSeasonal && applicationRound != null && applicationRound > 0 ? [applicationRound] : undefined,
    personsAllowed,
    first: SEARCH_PAGING_LIMIT,
    orderBy,
    reservationKind: kind,
  };
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
    label: getTranslation(val, "name", lang),
  };
}

function getUnitsOrderBy(lang: LocalizationLanguages) {
  switch (lang) {
    case "sv":
      return UnitOrderingChoices.NameSvAsc;
    case "en":
      return UnitOrderingChoices.NameEnAsc;
    default:
      return UnitOrderingChoices.NameFiAsc;
  }
}

export async function getSearchOptions(
  apolloClient: ApolloClient<unknown>,
  page: "seasonal" | "direct",
  locale: string
): Promise<OptionsListT> {
  const lang = getLocalizationLang(locale);
  const { data: optionsData } = await apolloClient.query<OptionsQuery, OptionsQueryVariables>({
    query: OptionsDocument,
    variables: {
      reservationUnitTypesOrderBy: ReservationUnitTypeOrderingChoices.RankAsc,
      intendedUseOrderBy: IntendedUseOrderingChoices.RankAsc,
      unitsOrderBy: getUnitsOrderBy(lang),
      equipmentsOrderBy: EquipmentOrderingChoices.CategoryRankAsc,
      ...(page === "direct" ? { onlyDirectBookable: true } : {}),
      ...(page === "seasonal" ? { onlySeasonalBookable: true } : {}),
    },
  });

  const reservationUnitTypes = filterNonNullable(
    optionsData?.reservationUnitTypes?.edges?.map((edge) => edge?.node)
  ).map((n) => translateOption(n, lang));
  const intendedUses = filterNonNullable(optionsData?.intendedUses?.edges?.map((edge) => edge?.node)).map((n) =>
    translateOption(n, lang)
  );

  const equipments = filterNonNullable(optionsData?.equipmentsAll).map((n) => translateOption(n, lang));
  const units = filterNonNullable(optionsData?.unitsAll).map((n) => translateOption(n, lang));
  const ageGroups = sortAgeGroups(optionsData?.ageGroups?.edges?.map((edge) => edge?.node ?? null) ?? []).map((n) => ({
    value: n.pk ?? 0,
    label: `${n.minimum || ""} - ${n.maximum || ""}`,
  }));
  const reservationPurposes = filterNonNullable(optionsData?.reservationPurposes?.edges?.map((edge) => edge?.node)).map(
    (n) => translateOption(n, lang)
  );

  const municipalities = Object.values(MunicipalityChoice).map((value) => ({
    label: value as string, // TODO: Translate this
    value: value,
  }));

  return {
    units,
    equipments,
    intendedUses,
    reservationPurposes,
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
    $intendedUseOrderBy: [IntendedUseOrderingChoices]
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
    intendedUses(orderBy: $intendedUseOrderBy) {
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
