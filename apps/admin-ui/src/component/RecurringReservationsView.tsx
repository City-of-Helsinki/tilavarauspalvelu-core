import React from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  type ReservationPageQuery,
  ReservationStateChoice,
  UserPermissionChoice,
} from "@gql/gql-types";
import {
  NewReservationListItem,
  ReservationList,
  type ReservationToCopyT,
} from "@/component/ReservationsList";
import { ReservationListButton } from "@/component/ReservationListButton";
import { DenyDialog } from "@/component/DenyDialog";
import { useModal } from "@/context/ModalContext";
import { EditTimeModal } from "@/component/EditTimeModal";
import { useCheckPermission, useRecurringReservations } from "@/hooks";
import {
  isPossibleToDeny,
  isPossibleToEdit,
} from "@/modules/reservationModificationRules";
import { CenterSpinner } from "common/styles/util";

type Props = {
  recurringPk: number;
  onSelect?: (selected: number) => void;
  onChange?: () => Promise<unknown>;
  onReservationUpdated?: () => void;
  // optional reservation to copy when creating a new reservation
  // contains a lot more information than the RecurringReservationQuery
  reservationToCopy?: ReservationToCopyT;
};

export function RecurringReservationsView({
  recurringPk,
  onSelect,
  onChange,
  onReservationUpdated,
  reservationToCopy,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const { setModalContent } = useModal();

  const { reservations, loading, refetch, recurringReservation } =
    useRecurringReservations(recurringPk);

  const unitPk = reservationToCopy?.reservationUnits?.[0]?.unit?.pk;
  const { hasPermission } = useCheckPermission({
    units: unitPk ? [unitPk] : [],
    permission: UserPermissionChoice.CanManageReservations,
  });

  if (loading) {
    return <CenterSpinner />;
  }

  const handleChangeSuccess = () => {
    setModalContent(null);
    refetch();
    onChange?.();
  };

  const handleChange = (res: (typeof reservations)[0]) => {
    setModalContent(
      <EditTimeModal
        // TODO this was here already (so probably uses the undefineds on purpose)
        // The correct way to deal with this would be either split
        // the Edit modal into two parts or do a query using id inside it (if we need all the data).
        reservation={res}
        onAccept={handleChangeSuccess}
        onClose={() => setModalContent(null)}
      />
    );
  };

  const handleCloseRemoveDialog = () => {
    setModalContent(null);
  };

  const handleRemove = (res: (typeof reservations)[0]) => {
    setModalContent(
      <DenyDialog
        // @ts-expect-error -- FIXME make a separate version of DenyDialog for recurring reservations
        reservation={res}
        onReject={() => {
          refetch();
          onReservationUpdated?.();
          handleCloseRemoveDialog();
        }}
        onClose={handleCloseRemoveDialog}
      />
    );
  };

  const { rejectedOccurrences } = recurringReservation ?? {};
  const rejected: NewReservationListItem[] =
    rejectedOccurrences?.map((x) => {
      const startDate = new Date(x.beginDatetime);
      const endDate = new Date(x.endDatetime);
      return {
        date: startDate,
        startTime: format(startDate, "H:mm"),
        endTime: format(endDate, "H:mm"),
        isRemoved: true,
        reason: x.rejectionReason,
        buttons: [],
      };
    }) ?? [];

  const forDisplay: NewReservationListItem[] = reservations.map((x) => {
    const buttons = [];
    const startDate = new Date(x.begin);
    const endDate = new Date(x.end);

    if (hasPermission && onChange && isPossibleToEdit(x.state, endDate)) {
      buttons.push(
        <ReservationListButton
          key="change"
          callback={() => handleChange(x)}
          type="change"
          t={t}
        />
      );
    }

    const { pk } = x;
    if (
      onSelect &&
      x.state === ReservationStateChoice.Confirmed &&
      pk != null
    ) {
      buttons.push(
        <ReservationListButton
          key="show"
          callback={() => onSelect(pk)}
          type="show"
          t={t}
        />
      );
    }
    if (hasPermission && isPossibleToDeny(x.state, endDate)) {
      buttons.push(
        <ReservationListButton
          key="deny"
          callback={() => handleRemove(x)}
          type="deny"
          t={t}
        />
      );
    }

    return {
      date: startDate,
      startTime: format(startDate, "H:mm"),
      endTime: format(endDate, "H:mm"),
      isRemoved: x.state === ReservationStateChoice.Denied,
      isCancelled: x.state === ReservationStateChoice.Cancelled,
      buttons,
    };
  });

  const items = forDisplay
    .concat(rejected)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <ReservationList
      header={t("RecurringReservationsView.Heading")}
      items={items}
      reservationToCopy={reservationToCopy}
      refetch={handleChangeSuccess}
    />
  );
}
