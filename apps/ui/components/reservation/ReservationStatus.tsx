import { camelCase } from "lodash";
import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import { ReservationStateChoice } from "@gql/gql-types";
import {
  IconCheck,
  IconCogwheel,
  IconCross,
  IconEuroSign,
  IconPen,
  IconQuestionCircle,
} from "hds-react";
import StatusLabel from "common/src/components/StatusLabel";
import { type StatusLabelType } from "common/src/tags";

export type Props = {
  state: ReservationStateChoice;
  testId?: string;
};

export function ReservationStatus({ state, testId }: Props): JSX.Element {
  const { t } = useTranslation();

  const statusProps = useMemo((): {
    type: StatusLabelType;
    icon: JSX.Element;
  } => {
    switch (state) {
      case ReservationStateChoice.Created:
        return {
          type: "draft",
          icon: <IconPen />,
        };
      case ReservationStateChoice.Cancelled:
        return {
          type: "neutral",
          icon: <IconCross />,
        };
      case ReservationStateChoice.Confirmed:
        return {
          type: "success",
          icon: <IconCheck />,
        };
      case ReservationStateChoice.Denied:
        return {
          type: "error",
          icon: <IconCross />,
        };
      case ReservationStateChoice.RequiresHandling:
        return {
          type: "info",
          icon: <IconCogwheel />,
        };
      case ReservationStateChoice.WaitingForPayment:
        return {
          type: "alert",
          icon: <IconEuroSign />,
        };
      default:
        return {
          type: "neutral",
          icon: <IconQuestionCircle />,
        };
    }
  }, [state]);

  const statusText = t(`reservations:status.${camelCase(state)}`);

  return (
    <StatusLabel
      type={statusProps.type}
      icon={statusProps.icon}
      testId={testId}
    >
      {statusText}
    </StatusLabel>
  );
}
