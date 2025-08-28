import { trim } from "lodash-es";
import {
  type Maybe,
  type ReservationNode,
  ReservationTypeChoice,
  type LocationFieldsFragment,
  type ReservationCommonFieldsFragment,
} from "@gql/gql-types";
import type { TFunction } from "next-i18next";
import { truncate } from "common/src/helpers";

export const DATE_FORMAT = "d.M.yyyy";
export const DATE_FORMAT_SHORT = "d.M.";

export const formatNumber = (input?: number | null, suffix?: string): string => {
  if (input == null) return "";

  const number = new Intl.NumberFormat("fi").format(input);

  return `${number}${suffix || ""}`;
};

interface IAgeGroups {
  minimum?: number;
  maximum?: number;
}

export function formatAgeGroups(ageGroups: IAgeGroups, t: TFunction): string {
  return t("common:agesSuffix", {
    range: trim(`${ageGroups.minimum || ""}-${ageGroups.maximum || ""}`, "-"),
  });
}

// TODO why have the two separate versions of this? (s)
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
  }
  if (
    // commented extra condition out for now, as the staff prefix was requested to be used for all staff reservations
    reservation.type === ReservationTypeChoice.Staff /* &&
    reservation.reserveeName ===
      `${reservation.user?.firstName} ${reservation.user?.lastName}` */
  ) {
    prefix = t ? t("reservation:prefixes.staff") : "";
  }
  return truncate(prefix + (reservation.reserveeName ?? "-"), length);
}
