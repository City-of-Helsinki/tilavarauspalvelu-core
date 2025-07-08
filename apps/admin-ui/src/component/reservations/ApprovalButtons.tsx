import React, { useRef } from "react";
import { type ApprovalButtonsFragment } from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { Button, ButtonSize, ButtonVariant } from "hds-react";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { DenyDialog } from "@/component/DenyDialog";
import { ApproveDialog } from "./ApproveDialog";
import { ReturnToRequiresHandlingDialog } from "./ReturnToRequiresHandlingDialog";
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
    reservationSeries {
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

export function ApprovalButtons({ isFree, reservation, handleClose, handleAccept, disableNonEssentialButtons }: Props) {
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
      <ReturnToRequiresHandlingDialog
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

  const endTime = new Date(reservation.endsAt);

  const btnCommon = {
    size: ButtonSize.Small,
    variant: ButtonVariant.Secondary,
    disabled: false,
  } as const;

  /* For now editing recurring is disabled (not implemented) */
  const isAllowedToModify = !reservation.reservationSeries && isPossibleToEdit(state, endTime);

  return (
    <>
      {endTime > new Date() && isPossibleToApprove(state, endTime) && (
        <Button
          {...btnCommon}
          onClick={handleApproveClick}
          data-testid="approval-buttons__approve-button"
          ref={approvalButtonRef}
        >
          {t("reservation:approve")}
        </Button>
      )}
      {isPossibleToDeny(state, endTime) && (
        <Button
          {...btnCommon}
          onClick={handleDenyClick}
          data-testid="approval-buttons__reject-button"
          ref={denyButtonRef}
        >
          {t("reservation:reject")}
        </Button>
      )}
      {isPossibleToReturn(state, endTime) && (
        <Button
          {...btnCommon}
          onClick={handleReturnToHandlingClick}
          data-testid="approval-buttons__return-to-handling-button"
          ref={returnToHandlingButtonRef}
        >
          {t("reservation:returnToHandling")}
        </Button>
      )}
      {!disableNonEssentialButtons && isAllowedToModify && (
        <ButtonLikeLink href="edit" data-testid="approval-buttons__edit-link">
          {t("reservation:ApprovalButtons.edit")}
        </ButtonLikeLink>
      )}
    </>
  );
}
