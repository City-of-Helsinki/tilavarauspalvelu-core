import React from "react";
import { useTranslation } from "next-i18next";
import { formatTime } from "ui/src/modules/date-utils";
import { CenterSpinner } from "ui/src/styled";
import { DenyDialog } from "@/components/DenyDialog";
import { EditTimeModal } from "@/components/EditTimeModal";
import { ReservationListButton } from "@/components/ReservationListButton";
import type { NewReservationListItem } from "@/components/ReservationsList";
import { ReservationList } from "@/components/ReservationsList";
import { useModal } from "@/context/ModalContext";
import { useReservationSeries, useSession } from "@/hooks";
import { hasPermission } from "@/modules/permissionHelper";
import { isPossibleToDeny, isPossibleToEdit } from "@/modules/reservationModificationRules";
import { ReservationStateChoice, UserPermissionChoice } from "@gql/gql-types";
import type { ReservationToCopyFragment } from "@gql/gql-types";

type Props = {
  reservationSeriesPk: number;
  onSelect?: (selected: number) => void;
  onChange?: () => Promise<unknown>;
  onReservationUpdated?: () => void;
  // optional reservation to copy when creating a new reservation
  // contains a lot more information than the ReservationSeriesQuery
  reservationToCopy?: ReservationToCopyFragment;
};

export function ReservationSeriesView({
  reservationSeriesPk,
  onSelect,
  onChange,
  onReservationUpdated,
  reservationToCopy,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const { setModalContent } = useModal();
  const { user } = useSession();
  const { reservations, loading, refetch, reservationSeries } = useReservationSeries(reservationSeriesPk);

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

  const { rejectedOccurrences } = reservationSeries ?? {};
  const rejected: NewReservationListItem[] =
    rejectedOccurrences?.map((x) => {
      const startDate = new Date(x.beginDatetime);
      const endDate = new Date(x.endDatetime);
      return {
        date: startDate,
        startTime: formatTime(startDate),
        endTime: formatTime(endDate),
        isRemoved: true,
        reason: x.rejectionReason,
        buttons: [],
      };
    }) ?? [];

  const unitPk = reservationToCopy?.reservationUnit?.unit?.pk;
  const hasManageAccess = hasPermission(user, UserPermissionChoice.CanManageReservations, unitPk);
  const forDisplay: NewReservationListItem[] = reservations.map((x) => {
    const buttons = [];
    const startDate = new Date(x.beginsAt);
    const endDate = new Date(x.endsAt);

    if (hasManageAccess && onChange && isPossibleToEdit(x.state, endDate)) {
      buttons.push(<ReservationListButton key="change" callback={() => handleChange(x)} type="change" t={t} />);
    }

    const { pk } = x;
    if (onSelect && x.state === ReservationStateChoice.Confirmed && pk != null) {
      buttons.push(<ReservationListButton key="show" callback={() => onSelect(pk)} type="show" t={t} />);
    }
    if (hasManageAccess && isPossibleToDeny(x.state, endDate)) {
      buttons.push(<ReservationListButton key="deny" callback={() => handleRemove(x)} type="deny" t={t} />);
    }

    return {
      date: startDate,
      startTime: formatTime(startDate),
      endTime: formatTime(endDate),
      isRemoved: x.state === ReservationStateChoice.Denied,
      isCancelled: x.state === ReservationStateChoice.Cancelled,
      buttons,
    };
  });

  const items = [...forDisplay, ...rejected].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <ReservationList
      header={t("reservation:SeriesView.Heading")}
      items={items}
      reservationToCopy={reservationToCopy}
      refetch={handleChangeSuccess}
    />
  );
}
