import {
  type InstructionsFragment,
  type Maybe,
  ReservationStateChoice,
} from "@/gql/gql-types";
import { gql } from "@apollo/client";
import { H4 } from "common/styled";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { Sanitize } from "common/src/components/Sanitize";
import { useTranslation } from "next-i18next";

type Props = {
  reservation: InstructionsFragment;
};
export function Instructions({ reservation }: Props): JSX.Element | null {
  const { t, i18n } = useTranslation();

  const reservationUnit = reservation.reservationUnits.find(() => true);
  const lang = convertLanguageCode(i18n.language);
  const instructionsKey = getReservationUnitInstructionsKey(reservation.state);
  const instructionsText =
    instructionsKey != null && reservationUnit != null
      ? getTranslationSafe(reservationUnit[`${instructionsKey}`], lang)
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
      <Sanitize html={instructionsText} />
    </div>
  );
}

type InstructionsKey =
  | "reservationPendingInstructionsTranslations"
  | "reservationCancelledInstructionsTranslations"
  | "reservationConfirmedInstructionsTranslations";
function getReservationUnitInstructionsKey(
  state: Maybe<ReservationStateChoice> | undefined
): InstructionsKey | null {
  switch (state) {
    case ReservationStateChoice.Created:
    case ReservationStateChoice.RequiresHandling:
      return "reservationPendingInstructionsTranslations";
    case ReservationStateChoice.Cancelled:
      return "reservationCancelledInstructionsTranslations";
    case ReservationStateChoice.Confirmed:
      return "reservationConfirmedInstructionsTranslations";
    case ReservationStateChoice.Denied:
    default:
      return null;
  }
}

export const INSTRUCTIOSN_FRAGMENT = gql`
  fragment Instructions on ReservationNode {
    id
    state
    reservationUnits {
      id
      reservationPendingInstructionsTranslations {
        fi
        en
        sv
      }
      reservationConfirmedInstructionsTranslations {
        fi
        en
        sv
      }
      reservationCancelledInstructionsTranslations {
        fi
        en
        sv
      }
    }
  }
`;
