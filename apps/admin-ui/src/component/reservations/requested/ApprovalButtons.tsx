import React from "react";
import { ReservationType, State } from "common/types/gql-types";
import { useTranslation } from "react-i18next";
import { addHours, isToday } from "date-fns";
import { Button } from "hds-react";
import { ButtonLikeLink } from "app/component/ButtonLikeLink";
import DenyDialog from "./DenyDialog";
import ApproveDialog from "./ApproveDialog";
import ReturnToRequiredHandlingDialog from "./ReturnToRequiresHandlingDialog";
import { useModal } from "../../../context/ModalContext";

/* Rules
 * Approve only if REQUIRES_HANDLING
 * Deny if REQUIRES_HANDLING or CONFIRMED
 * Return to handling if DENIED or CONFIRMED
 * Other states (e.g. WAITING_FOR_PAYMENT) are not allowed to be modified
 *
 * Allowed to change state (except deny unconfirmed) only till it's ended.
 * Allowed to modify the reservation after ending as long as it's the same date or within one hour.
 */
const isPossibleToApprove = (state: State, end: Date): boolean =>
  state === State.RequiresHandling && end > new Date();

const isPossibleToDeny = (state: State, end: Date): boolean => {
  if (state === State.RequiresHandling) {
    return true;
  }
  return state === State.Confirmed && end > new Date();
};

const isPossibleToReturn = (state: State, end: Date): boolean =>
  (state === State.Denied || state === State.Confirmed) && end > new Date();

const isPossibleToEdit = (state: State, end: Date): boolean => {
  if (state !== State.Confirmed) {
    return false;
  }
  const now = new Date();
  return end > addHours(now, -1) || isToday(end);
};

const ApprovalButtons = ({
  state,
  isFree,
  reservation,
  handleClose,
  handleAccept,
  disableNonEssentialButtons,
}: {
  state: State;
  isFree: boolean;
  reservation: ReservationType;
  handleClose: () => void;
  handleAccept: () => void;
  disableNonEssentialButtons?: boolean;
}) => {
  const { setModalContent } = useModal();
  const { t } = useTranslation();

  const handleDenyClick = () => {
    setModalContent(
      <DenyDialog
        reservations={[reservation]}
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

  const endTime = new Date(reservation.end);

  const btnCommon = {
    theme: "black",
    size: "small",
    variant: "secondary",
    disabled: false,
  } as const;

  /* For now editing recurring is disabled (not implemented) */
  const isAllowedToModify =
    !reservation.recurringReservation && isPossibleToEdit(state, endTime);

  return (
    <>
      {endTime > new Date() && isPossibleToApprove(state, endTime) && (
        <Button
          {...btnCommon}
          onClick={handleApproveClick}
          data-testid="approval-buttons__approve-button"
        >
          {t("RequestedReservation.approve")}
        </Button>
      )}
      {isPossibleToDeny(state, endTime) && (
        <Button
          {...btnCommon}
          onClick={handleDenyClick}
          data-testid="approval-buttons__reject-button"
        >
          {t("RequestedReservation.reject")}
        </Button>
      )}
      {isPossibleToReturn(state, endTime) && (
        <Button
          {...btnCommon}
          onClick={handleReturnToHandlingClick}
          data-testid="approval-buttons__return-to-handling-button"
        >
          {t("RequestedReservation.returnToHandling")}
        </Button>
      )}
      {!disableNonEssentialButtons && isAllowedToModify && (
        <ButtonLikeLink to="edit" data-testid="approval-buttons__edit-link">
          {t("ApprovalButtons.edit")}
        </ButtonLikeLink>
      )}
    </>
  );
};

export default ApprovalButtons;
