import React from "react";
import { ReservationState } from "common/types/gql-types";
import { Tag } from "hds-react";
import { useTranslation } from "react-i18next";

// TODO this is copy of ReservationUnitStateTag with modifications. Combine?
function ReservationStateTag({ state }: { state: ReservationState }) {
  const color = ((s: ReservationState) => {
    switch (s) {
      case ReservationState.ScheduledReservation:
        return "var(--color-summer-light)";
      case ReservationState.ScheduledPeriod:
        return "var(--color-bus-light)";
      case ReservationState.ScheduledClosing:
        return "var(--color-black-5)";
      case ReservationState.ReservationClosed:
        return "var(--color-black-10)";
      default:
        return "white";
    }
  })(state);

  const { t } = useTranslation();

  if (state === ReservationState.Reservable) {
    return null;
  }

  return (
    <Tag
      theme={{
        "--tag-background": color,
      }}
      labelProps={{ style: { whiteSpace: "nowrap" } }}
    >
      {t(`ReservationUnits.reservationState.${state}`)}
    </Tag>
  );
}

export default ReservationStateTag;
