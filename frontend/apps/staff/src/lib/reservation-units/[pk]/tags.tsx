import React from "react";
import { ReservationUnitPublishingState, ReservationUnitReservationState } from "@gql/gql-types";
import { IconCheck, IconClock, IconEye, IconEyeCrossed, IconLock, IconPen, IconQuestionCircle } from "hds-react";
import { useTranslation } from "next-i18next";
import StatusLabel, { type StatusLabelType } from "ui/src/components/StatusLabel";
import { NoWrap } from "ui/src/styled";

type StatusPropsType = {
  type: StatusLabelType;
  icon: JSX.Element;
};

export function ReservationStateTag({ state }: { state?: ReservationUnitReservationState }) {
  const statusProps = ((s?: ReservationUnitReservationState): StatusPropsType => {
    switch (s) {
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
  })(state);

  const { t } = useTranslation();

  if (!state) {
    return null;
  }
  if (state === ReservationUnitReservationState.Reservable) {
    return null;
  }

  return (
    <StatusLabel type={statusProps.type} icon={statusProps.icon}>
      {t(`reservationUnit:reservationState.${state}`)}
    </StatusLabel>
  );
}

const statusProps = (state?: ReservationUnitPublishingState): StatusPropsType => {
  switch (state) {
    case ReservationUnitPublishingState.Draft:
      return {
        type: "draft",
        icon: <IconPen />,
      };
    case ReservationUnitPublishingState.Hidden:
      return {
        type: "neutral",
        icon: <IconEyeCrossed />,
      };
    case ReservationUnitPublishingState.Published:
      return {
        type: "success",
        icon: <IconCheck />,
      };
    case ReservationUnitPublishingState.ScheduledHiding:
    case ReservationUnitPublishingState.ScheduledPeriod:
    case ReservationUnitPublishingState.ScheduledPublishing:
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

export function ReservationUnitStateTag({ state }: { state?: ReservationUnitPublishingState }): JSX.Element | null {
  const { t } = useTranslation();
  if (!state) {
    return null;
  }
  return (
    <StatusLabel type={statusProps(state).type} icon={statusProps(state).icon}>
      <NoWrap>{t(`reservationUnit:state.${state}`)}</NoWrap>
    </StatusLabel>
  );
}
