import React from "react";
import {
  ReservationType,
  ReservationsReservationStateChoices,
} from "common/types/gql-types";
import { useTranslation } from "react-i18next";
import { Button } from "hds-react";
import DenyDialog from "./DenyDialog";
import ApproveDialog from "./ApproveDialog";
import ReturnToRequiredHandlingDialog from "./ReturnToRequiresHandlingDialog";
import { useModal } from "../../../context/ModalContext";

/* Rules
 * Approve only if REQUIRES_HANDLING
 * Deny if REQUIRES_HANDLING or CONFIRMED
 * Return to handling if DENIED or CONFIRMED
 * Other states (e.g. WAITING_FOR_PAYMENT) are not allowed to be modified
 */
const isPossibleToApprove = (
  state: ReservationsReservationStateChoices
): boolean => state === ReservationsReservationStateChoices.RequiresHandling;

const isPossibleToDeny = (
  state: ReservationsReservationStateChoices
): boolean =>
  state === ReservationsReservationStateChoices.Confirmed ||
  state === ReservationsReservationStateChoices.RequiresHandling;

const isPossibleToReturn = (
  state: ReservationsReservationStateChoices
): boolean =>
  state === ReservationsReservationStateChoices.Denied ||
  state === ReservationsReservationStateChoices.Confirmed;

const ApprovalButtons = ({
  state,
  isFree,
  reservation,
  handleClose,
  handleAccept,
}: {
  state: ReservationsReservationStateChoices;
  isFree: boolean;
  reservation: ReservationType;
  handleClose: () => void;
  handleAccept: () => void;
}) => {
  const { setModalContent } = useModal();
  const { t } = useTranslation();

  const handleDenyClick = () => {
    setModalContent(
      <DenyDialog
        reservation={reservation}
        onReject={handleAccept}
        onClose={handleClose}
      />,
      true
    );
  };

  const handleReturnToHandlingClick = () => {
    setModalContent(
      <ReturnToRequiredHandlingDialog
        reservation={reservation}
        onAccept={handleAccept}
        onClose={handleClose}
      />,
      true
    );
  };

  const handleApproveClick = () => {
    setModalContent(
      <ApproveDialog
        isFree={isFree}
        reservation={reservation}
        onAccept={handleAccept}
        onClose={handleClose}
      />,
      true
    );
  };

  // Only Requires handling is allowed to be modified after it has ended
  const endTime = new Date(reservation.end);
  if (
    endTime < new Date() &&
    state !== ReservationsReservationStateChoices.RequiresHandling
  ) {
    return <div>{t("RequestedReservation.alreadyEnded")}</div>;
  }

  const btnCommon = {
    theme: "black",
    size: "small",
    variant: "secondary",
    disabled: false,
  } as const;

  return (
    <>
      {endTime > new Date() && isPossibleToApprove(state) && (
        <Button {...btnCommon} onClick={handleApproveClick}>
          {t("RequestedReservation.approve")}
        </Button>
      )}
      {isPossibleToDeny(state) && (
        <Button {...btnCommon} onClick={handleDenyClick}>
          {t("RequestedReservation.reject")}
        </Button>
      )}
      {isPossibleToReturn(state) && (
        <Button {...btnCommon} onClick={handleReturnToHandlingClick}>
          {t("RequestedReservation.returnToHandling")}
        </Button>
      )}
    </>
  );
};

export default ApprovalButtons;
