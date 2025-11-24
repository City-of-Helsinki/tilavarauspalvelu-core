import React from "react";
import { IconCheck, IconClock, IconEye, IconEyeCrossed, IconLock, IconPen, IconQuestionCircle } from "hds-react";
import { useTranslation } from "next-i18next";
import { ReservationUnitPublishingState, ReservationUnitReservationState } from "../../../gql/gql-types";
import { NoWrap } from "../../styled";
import { StatusLabel } from "../StatusLabel";
import type { StatusLabelType } from "../StatusLabel";

type StatusPropsType = {
  type: StatusLabelType;
  icon: React.ReactElement;
};

function getReservationStatusLabelProps(state: ReservationUnitReservationState): StatusPropsType {
  switch (state) {
    case ReservationUnitReservationState.Reservable:
      return { type: "success", icon: <IconEye /> };
    case ReservationUnitReservationState.ReservationClosed:
      return { type: "neutral", icon: <IconLock /> };
    case ReservationUnitReservationState.ScheduledReservation:
    case ReservationUnitReservationState.ScheduledClosing:
    case ReservationUnitReservationState.ScheduledPeriod:
      return { type: "info", icon: <IconClock /> };
  }
}

export function ReservationUnitReservationStatusLabel({
  state,
  slim,
}: {
  state: ReservationUnitReservationState;
  slim?: boolean;
}): React.ReactElement {
  const { t } = useTranslation();

  const { type, icon } = getReservationStatusLabelProps(state);
  return (
    <StatusLabel type={type} icon={icon} slim={slim}>
      {t(`reservationUnit:reservationState.${state}`)}
    </StatusLabel>
  );
}

function getPublishingStateProps(state: ReservationUnitPublishingState): StatusPropsType {
  switch (state) {
    case ReservationUnitPublishingState.Draft:
      return { type: "draft", icon: <IconPen /> };
    case ReservationUnitPublishingState.Hidden:
      return { type: "neutral", icon: <IconEyeCrossed /> };
    case ReservationUnitPublishingState.Published:
      return { type: "success", icon: <IconCheck /> };
    case ReservationUnitPublishingState.ScheduledHiding:
    case ReservationUnitPublishingState.ScheduledPeriod:
    case ReservationUnitPublishingState.ScheduledPublishing:
      return { type: "info", icon: <IconClock /> };
    case ReservationUnitPublishingState.Archived:
      return { type: "neutral", icon: <IconQuestionCircle /> };
  }
}

export function ReservationUnitPublishingStatusLabel({
  state,
  slim,
}: {
  state: ReservationUnitPublishingState;
  slim?: boolean;
}): React.ReactElement {
  const { t } = useTranslation();
  const { type, icon } = getPublishingStateProps(state);
  return (
    <StatusLabel type={type} icon={icon} slim={slim}>
      <NoWrap>{t(`reservationUnit:state.${state}`)}</NoWrap>
    </StatusLabel>
  );
}
