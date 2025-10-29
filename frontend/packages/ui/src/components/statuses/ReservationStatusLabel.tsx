import React from "react";
import { IconCheck, IconCogwheel, IconCross, IconEuroSign, IconPen } from "hds-react";
import { useTranslation } from "next-i18next";
import { ReservationStateChoice } from "../../../gql/gql-types";
import { StatusLabel, type StatusLabelType } from "../StatusLabel";

export type Props = {
  state: ReservationStateChoice;
  testId?: string;
};

function getStatusProps(s: ReservationStateChoice): {
  type: StatusLabelType;
  icon: React.ReactElement;
} {
  switch (s) {
    case ReservationStateChoice.Created:
      return { type: "draft", icon: <IconPen /> };
    case ReservationStateChoice.WaitingForPayment:
      return { type: "alert", icon: <IconEuroSign /> };
    case ReservationStateChoice.RequiresHandling:
      return { type: "info", icon: <IconCogwheel /> };
    case ReservationStateChoice.Confirmed:
      return { type: "success", icon: <IconCheck /> };
    case ReservationStateChoice.Denied:
      return { type: "error", icon: <IconCross /> };
    case ReservationStateChoice.Cancelled:
      return { type: "neutral", icon: <IconCross /> };
  }
}

export function ReservationStatusLabel({ state, testId }: Props): React.ReactElement {
  const { t } = useTranslation();

  const { type, icon } = getStatusProps(state);

  return (
    <StatusLabel type={type} icon={icon} data-testid={testId}>
      {t(`reservation:state.${state}`)}
    </StatusLabel>
  );
}
