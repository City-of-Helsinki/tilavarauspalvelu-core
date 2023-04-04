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

  // Backend doesn't allow changing the status if the reservation has ended
  const endTime = new Date(reservation.end);
  if (endTime < new Date()) {
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
      {/* Backend doesn't allow approving anything that isn't in RequiresHandling state */}
      {state === ReservationsReservationStateChoices.RequiresHandling && (
        <Button {...btnCommon} onClick={handleApproveClick}>
          {t("RequestedReservation.approve")}
        </Button>
      )}
      {state !== ReservationsReservationStateChoices.Denied && (
        <Button {...btnCommon} onClick={handleDenyClick}>
          {t("RequestedReservation.reject")}
        </Button>
      )}
      {state !== ReservationsReservationStateChoices.RequiresHandling && (
        <Button {...btnCommon} onClick={handleReturnToHandlingClick}>
          {t("RequestedReservation.returnToHandling")}
        </Button>
      )}
    </>
  );
};

export default ApprovalButtons;
