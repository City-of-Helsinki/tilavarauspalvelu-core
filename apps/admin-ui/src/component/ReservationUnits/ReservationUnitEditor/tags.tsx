import React from "react";
import { ReservationState, ReservationUnitState } from "common/types/gql-types";
import { Tag } from "hds-react";
import { useTranslation } from "react-i18next";

export function ReservationStateTag({ state }: { state: ReservationState }) {
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

const statusColor = (state: ReservationUnitState) => {
  switch (state) {
    case ReservationUnitState.Draft:
      return "var(--color-bus-light)";
    case ReservationUnitState.Hidden:
      return "var(--color-silver-light)";
    case ReservationUnitState.Published:
      return "var(--color-fog-light)";
    case ReservationUnitState.ScheduledHiding:
      return "var(--color-suomenlinna-light)";
    case ReservationUnitState.ScheduledPeriod:
      return "var(--color-summer-light)";
    case ReservationUnitState.ScheduledPublishing:
      return "var(--color-gold-light)";
    default:
      return "white";
  }
};

export function ReservationUnitStateTag({
  state,
}: {
  state: ReservationUnitState;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <Tag
      theme={{
        "--tag-background": statusColor(state),
      }}
    >
      <span style={{ whiteSpace: "nowrap" }}>
        {t(`ReservationUnits.state.${state}`)}
      </span>
    </Tag>
  );
}
