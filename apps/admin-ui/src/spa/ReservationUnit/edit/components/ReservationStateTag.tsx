import React from "react";
import { ReservationUnitReservationState } from "@gql/gql-types";
import { IconClock, IconEye, IconLock, IconQuestionCircle } from "hds-react";
import { useTranslation } from "react-i18next";
import StatusLabel from "common/src/components/StatusLabel";
import { type StatusLabelType } from "common/src/tags";

type StatusPropsType = {
  type: StatusLabelType;
  icon: JSX.Element;
};

const getReservationStateProps = (
  state?: ReservationUnitReservationState
): StatusPropsType => {
  switch (state) {
    case ReservationUnitReservationState.ScheduledReservation:
    case ReservationUnitReservationState.ScheduledPeriod:
    case ReservationUnitReservationState.ScheduledClosing:
      return {
        type: "info",
        icon: <IconClock aria-hidden="true" />,
      };
    case ReservationUnitReservationState.ReservationClosed:
      return {
        type: "neutral",
        icon: <IconLock aria-hidden="true" />,
      };
    case ReservationUnitReservationState.Reservable:
      return {
        type: "success",
        icon: <IconEye aria-hidden="true" />,
      };
    default:
      return {
        type: "neutral",
        icon: <IconQuestionCircle aria-hidden="true" />,
      };
  }
};

export function ReservationStateTag({
  state,
}: {
  state?: ReservationUnitReservationState;
}) {
  const { t } = useTranslation();

  if (!state || state === ReservationUnitReservationState.Reservable) {
    return null;
  }

  const reservationState = getReservationStateProps(state);
  return (
    <StatusLabel type={reservationState.type} icon={reservationState.icon}>
      {t(`ReservationUnits.reservationState.${state}`)}
    </StatusLabel>
  );
}
