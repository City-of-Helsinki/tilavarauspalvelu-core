import coreJoi from "joi";
import joiDate from "@joi/date";
import { startOfDay } from "date-fns";
import { ReservationUnitsReservationUnitReservationStartIntervalChoices } from "common/types/gql-types";
import { getDayIntervals } from "common/src/calendar/util";
import i18n from "../../../i18n";
import { ReservationType } from "./types";

const joi = coreJoi.extend(joiDate) as typeof coreJoi;

const TIME_PATTERN = /^[0-9+]{2}:[0-9+]{2}$/;

const timeWithIntervals = (
  interval: ReservationUnitsReservationUnitReservationStartIntervalChoices = ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins
): coreJoi.StringSchema => {
  const intervals = getDayIntervals("00:00", "23:59", interval).map(
    (startHMS) => startHMS.substring(0, 5)
  );
  return joi
    .string()
    .pattern(TIME_PATTERN)
    .valid(...intervals)
    .messages({
      "any.only": i18n.t("ReservationDialog.validation.interval", {
        interval: `${intervals.join(", ").substring(0, 50)}...`,
      }),
    });
};

export const reservationSchema = (
  interval?: ReservationUnitsReservationUnitReservationStartIntervalChoices
): coreJoi.ObjectSchema =>
  joi
    .object({
      type: joi
        .string()
        .required()
        .valid(
          ...Object.values(ReservationType).filter((v) => typeof v === "string")
        )
        .required()
        .messages({
          "any.required": i18n.t("ReservationDialog.validation.typeRequired"),
        }),
      date: joi
        .date()
        .format("D.M.yyyy")
        .required()
        .min(startOfDay(new Date()))
        .messages({
          "date.min": i18n.t("ReservationDialog.validation.noPastDate"),
        }),
      startTime: timeWithIntervals(interval),
      endTime: joi.string().pattern(TIME_PATTERN).required(),
      comments: joi.string().allow(""),
    })
    .options({
      allowUnknown: true,
      messages: {
        "date.format": i18n.t("validation.any.required"),
      },
    });
