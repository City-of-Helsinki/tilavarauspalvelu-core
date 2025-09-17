import React, { useRef } from "react";
import type { ReservationSeriesNode } from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { Button, ButtonSize, ButtonVariant } from "hds-react";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { DenyDialogSeries } from "@/component/DenyDialog";
import { useModal } from "@/context/ModalContext";
import { useReservationSeries } from "@/hooks";
import { isPossibleToDeny } from "@/modules/reservationModificationRules";
import { getReservationUrl } from "@/common/urls";

type Props = {
  reservationSeries: Pick<ReservationSeriesNode, "pk">;
  handleClose: () => void;
  // TODO weird name for the after deny callback
  handleAccept: () => void;
  disableNonEssentialButtons?: boolean;
};

// NOTE some copy paste from ApprovalButtons
export function ApprovalButtonsRecurring({
  reservationSeries,
  handleClose,
  handleAccept,
  disableNonEssentialButtons,
}: Readonly<Props>): JSX.Element | null {
  const { setModalContent } = useModal();
  const denyRecurringButtonRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  // check if there are any reservations that can be deleted
  const { loading, reservations, refetch } = useReservationSeries(reservationSeries.pk ?? undefined);

  const handleReject = () => {
    refetch();
    handleAccept();
  };

  // TODO don't need to do this anymore we can just pass the first reservation here
  // need to do get all data here otherwise totalCount is incorrect (filter here instead of in the query)
  const reservationsPossibleToDeny = reservations.filter((x) => isPossibleToDeny(x.state, new Date(x.beginsAt)));

  const reservation = reservationsPossibleToDeny.find(() => true);
  const handleDenyClick = () => {
    if (reservation == null) {
      return;
    }
    setModalContent(
      <DenyDialogSeries
        initialHandlingDetails={reservation.handlingDetails ?? ""}
        reservationSeries={reservationSeries}
        onReject={handleReject}
        onClose={handleClose}
        title={t("reservation:ApprovalButtons.recurring.DenyDialog.title")}
        focusAfterCloseRef={denyRecurringButtonRef}
      />
    );
  };

  if (loading || reservationsPossibleToDeny.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        size={ButtonSize.Small}
        variant={ButtonVariant.Secondary}
        onClick={handleDenyClick}
        data-testid="approval-buttons-recurring__reject-button"
        ref={denyRecurringButtonRef}
      >
        {t("reservation:ApprovalButtons.recurring.rejectAllButton")}
      </Button>
      {!disableNonEssentialButtons && (
        <>
          <ButtonLikeLink
            href={`${getReservationUrl(reservation?.pk)}/edit`}
            data-testid="approval-buttons-recurring__edit-link"
          >
            {t("reservation:ApprovalButtons.edit")}
          </ButtonLikeLink>
          <ButtonLikeLink href={`${getReservationUrl(reservation?.pk)}/series`}>
            {t("reservation:ApprovalButtons.editSeriesTime")}
          </ButtonLikeLink>
        </>
      )}
    </>
  );
}
