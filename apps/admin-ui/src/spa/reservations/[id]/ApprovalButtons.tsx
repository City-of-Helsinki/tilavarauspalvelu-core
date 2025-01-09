import React from "react";
import { ReservationStateChoice, type ReservationQuery } from "@gql/gql-types";
import { useTranslation } from "react-i18next";
import { Button } from "hds-react";
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

type ReservationType = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: ReservationType;
  state: ReservationStateChoice;
  isFree: boolean;
  handleClose: () => void;
  handleAccept: () => void;
  disableNonEssentialButtons?: boolean;
};

const ApprovalButtons = ({
  state,
  isFree,
  reservation,
  handleClose,
  handleAccept,
  disableNonEssentialButtons,
}: Props) => {
  const { setModalContent } = useModal();
  const { t } = useTranslation();

  const handleDenyClick = () => {
    setModalContent(
      <DenyDialog
        reservation={reservation}
        onReject={handleAccept}
        onClose={handleClose}
      />
    );
  };

  const handleReturnToHandlingClick = () => {
    setModalContent(
      <ReturnToRequiredHandlingDialog
        reservation={reservation}
        onAccept={handleAccept}
        onClose={handleClose}
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
      />
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
