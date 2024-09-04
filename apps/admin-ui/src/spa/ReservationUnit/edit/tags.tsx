import React from "react";
import { ReservationState, ReservationUnitState } from "@gql/gql-types";
import {
  IconCheck,
  IconClock,
  IconEye,
  IconEyeCrossed,
  IconLock,
  IconPen,
  IconQuestionCircle,
} from "hds-react";
import { useTranslation } from "react-i18next";
import StatusLabel, {
  type StatusLabelType,
} from "common/src/components/StatusLabel";

type StatusPropsType = {
  type: StatusLabelType;
  icon: JSX.Element;
};

export function ReservationStateTag({ state }: { state?: ReservationState }) {
  const statusProps = ((s?: ReservationState): StatusPropsType => {
    switch (s) {
      case ReservationState.ScheduledReservation:
      case ReservationState.ScheduledPeriod:
      case ReservationState.ScheduledClosing:
        return {
          type: "info",
          icon: <IconClock ariaHidden />,
        };
      case ReservationState.ReservationClosed:
        return {
          type: "neutral",
          icon: <IconLock ariaHidden />,
        };
      case ReservationState.Reservable:
        return {
          type: "success",
          icon: <IconEye ariaHidden />,
        };
      default:
        return {
          type: "neutral",
          icon: <IconQuestionCircle ariaHidden />,
        };
    }
  })(state);

  const { t } = useTranslation();

  if (!state) {
    return null;
  }
  if (state === ReservationState.Reservable) {
    return null;
  }

  return (
    <StatusLabel type={statusProps.type} icon={statusProps.icon}>
      {t(`ReservationUnits.reservationState.${state}`)}
    </StatusLabel>
  );
}

const statusProps = (state?: ReservationUnitState): StatusPropsType => {
  switch (state) {
    case ReservationUnitState.Draft:
      return {
        type: "draft",
        icon: <IconPen />,
      };
    case ReservationUnitState.Hidden:
      return {
        type: "neutral",
        icon: <IconEyeCrossed />,
      };
    case ReservationUnitState.Published:
      return {
        type: "success",
        icon: <IconCheck />,
      };
    case ReservationUnitState.ScheduledHiding:
    case ReservationUnitState.ScheduledPeriod:
    case ReservationUnitState.ScheduledPublishing:
      return {
        type: "info",
        icon: <IconClock />,
      };
    default:
      return {
        type: "neutral",
        icon: <IconQuestionCircle />,
      };
  }
};

export function ReservationUnitStateTag({
  state,
}: {
  state?: ReservationUnitState;
}): JSX.Element | null {
  const { t } = useTranslation();
  if (!state) {
    return null;
  }
  return (
    <StatusLabel type={statusProps(state).type} icon={statusProps(state).icon}>
      <span style={{ whiteSpace: "nowrap" }}>
        {t(`ReservationUnits.state.${state}`)}
      </span>
    </StatusLabel>
  );
}
