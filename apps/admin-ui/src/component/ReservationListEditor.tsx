import { useTranslation } from "next-i18next";
import {
  ReservationList,
  type NewReservationListItem,
} from "@/component/ReservationsList";
import { ReservationListButton } from "@/component/ReservationListButton";

type ReservationListEditorProps = {
  items: { reservations: NewReservationListItem[]; refetch: () => void };
  removedReservations: NewReservationListItem[];
  setRemovedReservations: (items: NewReservationListItem[]) => void;
  isTall?: boolean;
};

export function isReservationEq(
  a: NewReservationListItem,
  b: NewReservationListItem
) {
  return (
    a.date.getTime() === b.date.getTime() &&
    a.endTime === b.endTime &&
    a.startTime === b.startTime
  );
}

/// @param items the checked list of all new reservations to make
/// @param removedReservations the events the user wanted to remove
/// @param setRemovedReservations update the user's list
/// Using two arrays because modifiying a single array causes the hooks to rerun
/// flow: user makes a time selection => do a query => allow user to disable dates.
export function ReservationListEditor({
  items,
  removedReservations,
  setRemovedReservations,
  isTall,
}: ReservationListEditorProps) {
  const { t } = useTranslation();

  const handleRemove = (item: NewReservationListItem) => {
    const fid = removedReservations.findIndex((x) => isReservationEq(item, x));
    if (fid === -1) {
      setRemovedReservations([...removedReservations, item]);
    }
  };

  const handleRestore = (item: NewReservationListItem) => {
    items.refetch();
    const fid = removedReservations.findIndex((x) => isReservationEq(item, x));
    if (fid !== -1) {
      setRemovedReservations([
        ...removedReservations.slice(0, fid),
        ...removedReservations.slice(fid + 1),
      ]);
    }
  };

  const itemsWithButtons = items.reservations.map((x) => {
    if (x.isOverlapping) {
      return x;
    }
    const elem = removedReservations.find((y) => isReservationEq(x, y));
    const isRemoved = elem !== undefined;

    return {
      ...x,
      isRemoved,
      buttons: [
        ReservationListButton({
          callback: isRemoved ? () => handleRestore(x) : () => handleRemove(x),
          type: isRemoved ? "restore" : "remove",
          t,
        }),
      ],
    };
  });

  return (
    <ReservationList
      key="list-editor"
      items={itemsWithButtons}
      hasPadding
      isTall={isTall}
    />
  );
}
