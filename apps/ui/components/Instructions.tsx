import {
  type Maybe,
  type ReservationQuery,
  ReservationStateChoice,
} from "@/gql/gql-types";
import { H4 } from "common";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { useTranslation } from "next-i18next";

// TODO replace with a fragment
type NodeT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: Pick<NodeT, "reservationUnits" | "state">;
};

export function Instructions({ reservation }: Props): JSX.Element | null {
  const { t, i18n } = useTranslation();

  const reservationUnit = reservation.reservationUnits.find(() => true);
  const lang = convertLanguageCode(i18n.language);
  const instructionsKey = getReservationUnitInstructionsKey(reservation.state);
  const instructionsText =
    instructionsKey != null && reservationUnit != null
      ? getTranslationSafe(reservationUnit, instructionsKey, lang)
      : null;
  const showInstructions =
    reservationUnit != null &&
    instructionsKey != null &&
    instructionsText != null &&
    instructionsText !== "";

  if (!showInstructions) {
    return null;
  }

  return (
    <div>
      <H4 as="h2">{t("reservations:reservationInfo")}</H4>
      <p>{instructionsText}</p>
    </div>
  );
}

type InstructionsKey =
  | "reservationPendingInstructions"
  | "reservationCancelledInstructions"
  | "reservationConfirmedInstructions";
function getReservationUnitInstructionsKey(
  state: Maybe<ReservationStateChoice> | undefined
): InstructionsKey | null {
  switch (state) {
    case ReservationStateChoice.Created:
    case ReservationStateChoice.RequiresHandling:
      return "reservationPendingInstructions";
    case ReservationStateChoice.Cancelled:
      return "reservationCancelledInstructions";
    case ReservationStateChoice.Confirmed:
      return "reservationConfirmedInstructions";
    case ReservationStateChoice.Denied:
    default:
      return null;
  }
}
