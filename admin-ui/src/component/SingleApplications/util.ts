import { isSameDay } from "date-fns";
import { TFunction } from "i18next";
import { AgeGroupType, Maybe, ReservationType } from "../../common/gql-types";
import { formatDate, formatTime } from "../../common/util";

export const reservationDateTime = (
  start: string,
  end: string,
  t: TFunction
): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startDay = t(`dayShort.${startDate.getDay()}`);

  return isSameDay(startDate, endDate)
    ? `${startDay} ${formatDate(start)} klo ${formatTime(start)} - ${formatTime(
        end
      )}`
    : `${formatDate(start)} klo ${formatTime(start)} - ${formatDate(
        end
      )} klo ${formatTime(end)}`;
};

export const reservationPrice = (
  reservation: ReservationType,
  t: TFunction
): string => {
  if (!reservation.price) {
    return t("SingleApplication.noPrice");
  }
  return `${String(reservation.price)}€`;
};

export const ageGroup = (
  group: Maybe<AgeGroupType> | undefined
): string | null =>
  group ? `${group.minimum} - ${group.maximum || ""}` : null;
