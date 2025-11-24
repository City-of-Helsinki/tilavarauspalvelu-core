import React from "react";
import { IconArrowTopRight, IconCheck, IconClock, IconCogwheel, IconEnvelope } from "hds-react";
import { useTranslation } from "next-i18next";
import { ApplicationRoundStatusChoice } from "../../../gql/gql-types";
import { StatusLabel } from "../StatusLabel";
import type { StatusLabelType } from "../StatusLabel";

type RoundStatus = {
  type: StatusLabelType;
  icon: JSX.Element;
};

export function getApplicationRoundStatus(status: ApplicationRoundStatusChoice): RoundStatus {
  switch (status) {
    case ApplicationRoundStatusChoice.Open:
      return { type: "alert", icon: <IconClock /> };
    case ApplicationRoundStatusChoice.InAllocation:
      return { type: "info", icon: <IconCogwheel /> };
    case ApplicationRoundStatusChoice.Handled:
      return { type: "success", icon: <IconCheck /> };
    case ApplicationRoundStatusChoice.ResultsSent:
      return { type: "success", icon: <IconEnvelope /> };
    case ApplicationRoundStatusChoice.Upcoming:
      return { type: "draft", icon: <IconArrowTopRight /> };
  }
}

type Props = {
  status: ApplicationRoundStatusChoice;
};

export function ApplicationRoundStatusLabel({ status }: Props): React.ReactElement {
  const { t } = useTranslation();

  const { type, icon } = getApplicationRoundStatus(status);
  return (
    <StatusLabel type={type} icon={icon}>
      {t(`applicationRound:statuses.${status}`)}
    </StatusLabel>
  );
}
