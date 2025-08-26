/// This file contains the search query for reservation units
/// e.g. the common search pages (both seasonal and single)
import {
  filterEmptyArray,
  filterNonNullable,
  getLocalizationLang,
  ignoreMaybeArray,
  mapParamToInteger,
  toNumber,
} from "common/src/helpers";
import { type LocalizationLanguages } from "common/src/urlBuilder";
import {
  EquipmentOrderSet,
  type Maybe,
  MunicipalityChoice,
  OptionsDocument,
  type OptionsQuery,
  type OptionsQueryVariables,
  PurposeOrderSet,
  type QueryReservationUnitsArgs,
  ReservationKind,
  ReservationUnitOrderSet,
  ReservationUnitTypeOrderSet,
  UnitOrderSet,
} from "@gql/gql-types";
import { convertLanguageCode, getTranslationSafe, toApiDate } from "common/src/common/util";
import { fromUIDate } from "./util";
import { startOfDay } from "date-fns";
import { SEARCH_PAGING_LIMIT } from "./const";
import { type ApolloClient, gql } from "@apollo/client";
import { type ReadonlyURLSearchParams } from "next/navigation";
import { transformAccessTypeSafe } from "common/src/conversion";
import { type OptionsListT, type OptionT } from "common/src/modules/search";

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
function transformSortString(orderBy: string | null, language: string, desc: boolean): ReservationUnitOrderSet[] {
  const lang = getLocalizationLang(language);
  const transformed = transformOrderBy(orderBy ?? "name", desc, lang) ?? transformOrderByName(false, lang);
  // NOTE a weird backend issue that requires two orderBy params (otherwise 2nd+ page is sometimes incorrect)
  const sec = desc ? ReservationUnitOrderSet.PkDesc : ReservationUnitOrderSet.PkAsc;
  return [transformed, sec];
}

function filterEmpty<T>(val: T | null | undefined): T | undefined {
  if (val == null) {
    return undefined;
  }
  if (typeof val === "string") {
    return val.trim() !== "" ? val : undefined;
  }
  if (typeof val === "number") {
    return val > 0 ? val : undefined;
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

  const isSeasonal = kind === ReservationKind.Season;
  const today = startOfDay(new Date());

  const accessType = filterNonNullable(values.getAll("accessTypes").map(transformAccessTypeSafe));

  const textSearch = filterEmpty(values.get("textSearch"));
  const personsAllowed = filterEmpty(toNumber(values.get("personsAllowed")));
  const purposes = filterEmptyArray(mapParamToInteger(values.getAll("purposes"), 1));
  const unit = filterEmptyArray(mapParamToInteger(values.getAll("units"), 1));
  const reservationUnitTypes = filterEmptyArray(mapParamToInteger(values.getAll("reservationUnitTypes"), 1));
  const equipments = filterEmptyArray(mapParamToInteger(values.getAll("equipments"), 1));

  const applicationRound = "applicationRound" in rest ? filterEmpty(rest.applicationRound) : undefined;
  const reservationPeriodBeginDate = "reservationPeriodBeginDate" in rest ? rest.reservationPeriodBeginDate : undefined;
  const reservationPeriodEndDate = "reservationPeriodEndDate" in rest ? rest.reservationPeriodEndDate : undefined;

  const startDate = fromUIDate(ignoreMaybeArray(values.getAll("startDate")) ?? "");
  const endDate = fromUIDate(ignoreMaybeArray(values.getAll("endDate")) ?? "");
  const reservableDateStart = startDate && startDate >= today ? toApiDate(startDate) : undefined;
  const reservableDateEnd = endDate && endDate >= today ? toApiDate(endDate) : undefined;

  const timeEnd = filterEmpty(ignoreMaybeArray(values.getAll("timeEnd")));
  const timeBegin = filterEmpty(ignoreMaybeArray(values.getAll("timeBegin")));
  const duration = filterEmpty(toNumber(ignoreMaybeArray(values.getAll("duration"))));
  const showOnlyReservable = ignoreMaybeArray(values.getAll("showOnlyReservable")) !== "false";

  return {
    first: SEARCH_PAGING_LIMIT,
    orderBy,
    filter: {
      accessType: {
        accessTypes: accessType,
        accessTypeBeginDate: filterEmpty(isSeasonal ? reservationPeriodBeginDate : reservableDateStart),
        accessTypeEndDate: filterEmpty(isSeasonal ? reservationPeriodEndDate : reservableDateEnd),
      },
      applicationRound: isSeasonal && applicationRound ? [applicationRound] : undefined,
      equipments,
      isDraft: false,
      isVisible: true,
      personsAllowed,
      purposes,
      reservationKind: kind,
      reservationUnitType: reservationUnitTypes,
      textSearch: textSearch,
      unit,
    },
    firstReservableTime: {
      // reservableDateStart is used to find effectiveAccessType in /recurring/[id] page
      reservableDateStart: filterEmpty(isSeasonal ? reservationPeriodBeginDate : reservableDateStart),
      reservableDateEnd: filterEmpty(isSeasonal ? reservationPeriodEndDate : reservableDateEnd),
      reservableTimeStart: timeBegin,
      reservableTimeEnd: timeEnd,
      reservableMinimumDurationMinutes: duration,
      showOnlyReservable: !isSeasonal && showOnlyReservable,
    },
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
    label: getTranslationSafe(val, "name", lang),
  };
}

export async function getSearchOptions(
  apolloClient: ApolloClient<unknown>,
  page: "seasonal" | "direct",
  locale: string
): Promise<OptionsListT> {
  const lang = convertLanguageCode(locale);
  const { data: optionsData } = await apolloClient.query<OptionsQuery, OptionsQueryVariables>({
    query: OptionsDocument,
    variables: {
      reservationUnitTypesOrderBy: ReservationUnitTypeOrderSet.RankAsc,
      purposesOrderBy: PurposeOrderSet.RankAsc,
      unitsOrderBy: UnitOrderSet.NameFiAsc,
      equipmentsOrderBy: EquipmentOrderSet.CategoryRankAsc,
      onlyDirectBookable: page === "direct",
      onlySeasonalBookable: page === "seasonal",
    },
  });

  const reservationUnitTypes = filterNonNullable(optionsData?.allReservationUnitTypes).map((n) =>
    translateOption(n, lang)
  );
  const purposes = filterNonNullable(optionsData?.allPurposes).map((n) => translateOption(n, lang));
  const equipments = filterNonNullable(optionsData?.allEquipments).map((n) => translateOption(n, lang));
  const units = filterNonNullable(optionsData?.allUnits).map((n) => translateOption(n, lang));
  const ageGroups = sortAgeGroups(filterNonNullable(optionsData?.allAgeGroups)).map((n) => ({
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

// There is a duplicate in admin-ui, but it doesn't have translations
export const OPTIONS_QUERY = gql`
  query Options(
    $reservationUnitTypesOrderBy: [ReservationUnitTypeOrderSet!]
    $purposesOrderBy: [PurposeOrderSet!]
    $unitsOrderBy: [UnitOrderSet!]
    $equipmentsOrderBy: [EquipmentOrderSet!]
    $reservationPurposesOrderBy: [ReservationPurposeOrderSet!]
    # Filter
    $onlyDirectBookable: Boolean!
    $onlySeasonalBookable: Boolean!
  ) {
    allReservationUnitTypes(orderBy: $reservationUnitTypesOrderBy) {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    allPurposes(orderBy: $purposesOrderBy) {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    allReservationPurposes(orderBy: $reservationPurposesOrderBy) {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    allAgeGroups {
      id
      pk
      minimum
      maximum
    }
    allEquipments(orderBy: $equipmentsOrderBy) {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    allUnits(
      orderBy: $unitsOrderBy
      filter: {
        onlyDirectBookable: $onlyDirectBookable
        onlySeasonalBookable: $onlySeasonalBookable
        publishedReservationUnits: true
      }
    ) {
      id
      pk
      nameFi
      nameSv
      nameEn
    }
  }
`;
