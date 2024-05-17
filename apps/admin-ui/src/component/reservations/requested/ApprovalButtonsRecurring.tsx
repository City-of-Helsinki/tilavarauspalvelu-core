import React from "react";
import { State, type ReservationQuery } from "@gql/gql-types";
import { useTranslation } from "react-i18next";
import { Button } from "hds-react";
import { ButtonLikeLink } from "app/component/ButtonLikeLink";
import DenyDialog from "./DenyDialog";
import { useModal } from "@/context/ModalContext";
import { useRecurringReservations } from "./hooks";

// TODO use a fragment
type ReservationType = NonNullable<ReservationQuery["reservation"]>;
type RecurringReservationType = NonNullable<
  ReservationType["recurringReservation"]
>;
type Props = {
  recurringReservation: RecurringReservationType;
  handleClose: () => void;
  // TODO weird name for the after deny callback
  handleAccept: () => void;
  disableNonEssentialButtons?: boolean;
};

// NOTE some copy paste from ApprovalButtons
const ApprovalButtonsRecurring = ({
  recurringReservation,
  handleClose,
  handleAccept,
  disableNonEssentialButtons,
}: Props): JSX.Element | null => {
  const { setModalContent } = useModal();
  const { t } = useTranslation();

  const { loading, reservations, refetch } = useRecurringReservations(
    recurringReservation.pk ?? undefined
  );

  const handleReject = () => {
    refetch();
    handleAccept();
  };

  const now = new Date();
  // need to do get all data here otherwise totalCount is incorrect (filter here instead of in the query)
  const reservationsPossibleToDelete = reservations
    .filter((x) => new Date(x.begin) > now)
    .filter((x) => x.state === State.Confirmed);

  const handleDenyClick = () => {
    setModalContent(
      <DenyDialog
        reservations={reservationsPossibleToDelete}
        onReject={handleReject}
        onClose={handleClose}
        title={t("ApprovalButtons.recurring.DenyDialog.title")}
      />,
      true
    );
  };

  if (loading) {
    return null;
  }

  const btnCommon = {
    theme: "black",
    size: "small",
    variant: "secondary",
    disabled: false,
  } as const;

  if (reservationsPossibleToDelete.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        {...btnCommon}
        onClick={handleDenyClick}
        data-testid="approval-buttons-recurring__reject-button"
      >
        {t("ApprovalButtons.recurring.rejectAllButton")}
      </Button>
      {!disableNonEssentialButtons && (
        <ButtonLikeLink
          to="edit"
          data-testid="approval-buttons-recurring__edit-link"
        >
          {t("ApprovalButtons.edit")}
        </ButtonLikeLink>
      )}
    </>
  );
};

export default ApprovalButtonsRecurring;
