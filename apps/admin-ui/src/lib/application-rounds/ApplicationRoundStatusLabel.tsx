import React from "react";
import { IconArrowTopRight, IconCheck, IconClock, IconCogwheel, IconEnvelope, IconQuestionCircle } from "hds-react";
import { useTranslation } from "next-i18next";
import { ApplicationRoundStatusChoice, type Maybe } from "@gql/gql-types";
import StatusLabel from "common/src/components/StatusLabel";
import { type StatusLabelType } from "common/src/tags";

type RoundStatus = {
  type: StatusLabelType;
  icon: JSX.Element;
  label: string;
  group: string;
};

export function getApplicationRoundStatus(status: Maybe<ApplicationRoundStatusChoice> | undefined): RoundStatus {
  switch (status) {
    case ApplicationRoundStatusChoice.Open:
      return {
        group: "g1",
        type: "alert",
        icon: <IconClock />,
        label: status,
      };
    case ApplicationRoundStatusChoice.InAllocation:
      return {
        group: "g1",
        type: "info",
        icon: <IconCogwheel />,
        label: status,
      };
    case ApplicationRoundStatusChoice.Handled:
      return {
        group: "g2",
        type: "success",
        icon: <IconCheck />,
        label: status,
      };
    case ApplicationRoundStatusChoice.Sent:
      return {
        group: "g2",
        type: "success",
        icon: <IconEnvelope />,
        label: status,
      };
    case ApplicationRoundStatusChoice.Upcoming:
      return {
        group: "g4",
        type: "draft",
        icon: <IconArrowTopRight />,
        label: status,
      };
    default:
      return {
        group: "g5",
        type: "neutral",
        icon: <IconQuestionCircle />,
        label: status ?? "-",
      };
  }
}

export function ApplicationRoundStatusLabel({
  status,
}: {
  status: Maybe<ApplicationRoundStatusChoice> | undefined;
}): JSX.Element {
  const { t } = useTranslation();
  if (!status) {
    return (
      <StatusLabel type="neutral" icon={<IconQuestionCircle />}>
        {t("applicationRound:statuses.unknown")}
      </StatusLabel>
    );
  }

  const convertedStatus = getApplicationRoundStatus(status);
  return (
    <StatusLabel type={convertedStatus.type} icon={convertedStatus.icon}>
      {t(`applicationRound:statuses.${convertedStatus.label}`)}
    </StatusLabel>
  );
}
