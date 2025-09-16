import { type InstructionsFragment, type Maybe, ReservationStateChoice } from "@/gql/gql-types";
import { gql } from "@apollo/client";
import { H4 } from "common/styled";
import { convertLanguageCode, getTranslationSafe } from "common/src/common/util";
import { Sanitize } from "common/src/components/Sanitize";
import { useTranslation } from "next-i18next";

type Props = {
  reservation: InstructionsFragment;
};
export function Instructions({ reservation }: Props): JSX.Element | null {
  const { t, i18n } = useTranslation();

  const lang = convertLanguageCode(i18n.language);
  const instructionsKey = getReservationUnitInstructionsKey(reservation.state);

  const instructionsText =
    instructionsKey != null ? getTranslationSafe(reservation.reservationUnit, instructionsKey, lang) : null;
  const showInstructions = instructionsKey != null && instructionsText != null && instructionsText !== "";

  if (!showInstructions) {
    return null;
  }

  return (
    <div>
      <H4 as="h2">{t("reservations:reservationInfo")}</H4>
      <Sanitize html={instructionsText} />
    </div>
  );
}

type InstructionsKey =
  | "reservationPendingInstructions"
  | "reservationCancelledInstructions"
  | "reservationConfirmedInstructions";

export function getReservationUnitInstructionsKey(
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
    case ReservationStateChoice.WaitingForPayment:
    case null:
    case undefined:
      return null;
  }
}

export const INSTRUCTIONS_FRAGMENT = gql`
  fragment Instructions on ReservationNode {
    id
    state
    reservationUnit {
      id
      reservationPendingInstructionsFi
      reservationPendingInstructionsEn
      reservationPendingInstructionsSv
      reservationConfirmedInstructionsFi
      reservationConfirmedInstructionsEn
      reservationConfirmedInstructionsSv
      reservationCancelledInstructionsFi
      reservationCancelledInstructionsEn
      reservationCancelledInstructionsSv
    }
  }
`;
