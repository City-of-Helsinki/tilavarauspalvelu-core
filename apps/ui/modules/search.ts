/// This file contains the search query for reservation units
/// e.g. the common search pages (both seasonal and single)
import { LocalizationLanguages, getLocalizationLang } from "common/src/helpers";
import { ReservationUnitOrderingChoices } from "common/types/gql-types";

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
export function transformSortString(
  orderBy: string | null,
  language: string,
  desc: boolean
): ReservationUnitOrderingChoices[] {
  const lang = getLocalizationLang(language);

  const transformed = transformOrderBy(orderBy ?? "name", desc, lang);
  if (transformed == null) {
    return [transformOrderByName(false, lang)];
  }
  return [transformed];
}
