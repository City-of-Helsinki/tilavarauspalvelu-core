import React, { useRef } from "react";
import { type ApprovalButtonsFragment } from "@gql/gql-types";
import { useTranslation } from "react-i18next";
import { Button, ButtonSize, ButtonVariant } from "hds-react";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { DenyDialog } from "@/component/DenyDialog";
import ApproveDialog from "./ApproveDialog";
import ReturnToRequiredHandlingDialog from "./ReturnToRequiresHandlingDialog";
import { useModal } from "@/context/ModalContext";
import {
  isPossibleToApprove,
  isPossibleToDeny,
  isPossibleToEdit,
  isPossibleToReturn,
} from "@/modules/reservationModificationRules";
import { gql } from "@apollo/client";

export const APPROVAL_BUTTONS_FRAGMENT = gql`
  fragment ApprovalButtons on ReservationNode {
    id
    state
    ...DenyDialogFields
    ...ApprovalDialogFields
    recurringReservation {
      id
      pk
    }
  }
`;

type Props = {
  reservation: ApprovalButtonsFragment;
  isFree: boolean;
  handleClose: () => void;
  handleAccept: () => void;
  disableNonEssentialButtons?: boolean;
};

function ApprovalButtons({ isFree, reservation, handleClose, handleAccept, disableNonEssentialButtons }: Props) {
  const { setModalContent } = useModal();
  const approvalButtonRef = useRef<HTMLButtonElement>(null);
  const denyButtonRef = useRef<HTMLButtonElement>(null);
  const returnToHandlingButtonRef = useRef<HTMLButtonElement>(null);

  const { t } = useTranslation();

  const { state } = reservation;

  const handleDenyClick = () => {
    setModalContent(
      <DenyDialog
        reservation={reservation}
        onReject={handleAccept}
        onClose={handleClose}
        focusAfterCloseRef={denyButtonRef}
      />
    );
  };

  const handleReturnToHandlingClick = () => {
    setModalContent(
      <ReturnToRequiredHandlingDialog
        reservation={reservation}
        onAccept={handleAccept}
        onClose={handleClose}
        focusAfterCloseRef={returnToHandlingButtonRef}
      />
    );
  };

  const handleApproveClick = () => {
    setModalContent(
      <ApproveDialog
        isFree={isFree}
        reservation={reservation}
        onAccept={handleAccept}
        onClose={handleClose}
        focusAfterCloseRef={approvalButtonRef}
      />
    );
  };

  const endTime = new Date(reservation.end);

  const btnCommon = {
    size: ButtonSize.Small,
    variant: ButtonVariant.Secondary,
    disabled: false,
  } as const;

  /* For now editing recurring is disabled (not implemented) */
  const isAllowedToModify = !reservation.recurringReservation && isPossibleToEdit(state, endTime);

  return (
    <>
      {endTime > new Date() && isPossibleToApprove(state, endTime) && (
        <Button
          {...btnCommon}
          onClick={handleApproveClick}
          data-testid="approval-buttons__approve-button"
          ref={approvalButtonRef}
        >
          {t("RequestedReservation.approve")}
        </Button>
      )}
      {isPossibleToDeny(state, endTime) && (
        <Button
          {...btnCommon}
          onClick={handleDenyClick}
          data-testid="approval-buttons__reject-button"
          ref={denyButtonRef}
        >
          {t("RequestedReservation.reject")}
        </Button>
      )}
      {isPossibleToReturn(state, endTime) && (
        <Button
          {...btnCommon}
          onClick={handleReturnToHandlingClick}
          data-testid="approval-buttons__return-to-handling-button"
          ref={returnToHandlingButtonRef}
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
}

export default ApprovalButtons;
