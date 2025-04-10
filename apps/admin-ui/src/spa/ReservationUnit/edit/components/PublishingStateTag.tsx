import React from "react";
import { ReservationUnitPublishingState } from "@gql/gql-types";
import {
  IconCheck,
  IconClock,
  IconEyeCrossed,
  IconPen,
  IconQuestionCircle,
} from "hds-react";
import { useTranslation } from "react-i18next";
import StatusLabel from "common/src/components/StatusLabel";
import { type StatusLabelType } from "common/src/tags";
import { NoWrap } from "common/styled";

type StatusPropsType = {
  type: StatusLabelType;
  icon: JSX.Element;
};

const getPublishingStateProps = (
  state?: ReservationUnitPublishingState
): StatusPropsType => {
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

export function PublishingStateTag({
  state,
}: {
  state?: ReservationUnitPublishingState;
}): JSX.Element | null {
  const { t } = useTranslation();

  if (!state) return null;

  const publishingState = getPublishingStateProps(state);
  return (
    <StatusLabel type={publishingState.type} icon={publishingState.icon}>
      <NoWrap>{t(`ReservationUnits.state.${state}`)}</NoWrap>
    </StatusLabel>
  );
}
