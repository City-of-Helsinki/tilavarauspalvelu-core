import { trim } from "lodash-es";
import type { TFunction } from "next-i18next";
import { truncate } from "ui/src/modules/helpers";
import {
  type Maybe,
  type ReservationNode,
  ReservationTypeChoice,
  type LocationFieldsFragment,
  type ReservationCommonFieldsFragment,
} from "@gql/gql-types";

export const formatNumber = (input?: number | null, suffix?: string): string => {
  if (input == null) return "";

  const number = new Intl.NumberFormat("fi").format(input);

  return `${number}${suffix || ""}`;
};

export function formatAgeGroup(
  group: Maybe<Pick<NonNullable<ReservationNode["ageGroup"]>, "minimum" | "maximum">> | undefined
): string | null {
  return group ? `${group.minimum}-${group.maximum || ""}` : null;
}

export function formatAddress(location: LocationFieldsFragment | null | undefined, defaultValue = "-"): string {
  if (!location) {
    return defaultValue;
  }
  const res = trim(`${location.addressStreetFi ?? ""}, ${location.addressZip} ${location.addressCityFi ?? ""}`, ", ");
  if (res === "") {
    return defaultValue;
  }
  return res;
}

export function getTranslatedError(t: TFunction, error: string | undefined): string | undefined {
  if (error == null) {
    return undefined;
  }
  return t(`forms:errors.${error}`);
}

export function getReserveeName(
  reservation: Pick<ReservationCommonFieldsFragment, "reserveeName" | "type">,
  t: TFunction,
  length = 50
): string {
  let prefix = "";
  if (reservation.type === ReservationTypeChoice.Behalf) {
    prefix = t ? t("reservation:prefixes.behalf") : "";
  } else if (reservation.type === ReservationTypeChoice.Staff) {
    prefix = t ? t("reservation:prefixes.staff") : "";
  }
  return truncate(`${prefix}${reservation.reserveeName ?? "-"}`, length);
}
