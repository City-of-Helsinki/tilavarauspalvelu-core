import { Tag } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { ApplicationRoundStatusChoice } from "common/types/gql-types";

type RoundStatus = {
  color: string;
  label: string;
  group: string;
};

export const getApplicationRoundStatus = (
  status: ApplicationRoundStatusChoice | undefined
): RoundStatus => {
  switch (status) {
    case ApplicationRoundStatusChoice.Open:
      return {
        group: "g1",
        color: "var(--color-gold-medium-light)",
        label: "review",
      };
    case ApplicationRoundStatusChoice.InAllocation:
      return {
        group: "g1",
        color: "var(--color-info-light)",
        label: "handling",
      };
    case ApplicationRoundStatusChoice.Handled:
    case ApplicationRoundStatusChoice.ResultsSent:
      return {
        group: "g2",
        color: "var(--color-bus-light)",
        label: "handled",
      };
    case ApplicationRoundStatusChoice.Upcoming:
      return {
        group: "g4",
        color: "var(--color-engel-light)",
        label: "upcoming",
      };
    default:
      return {
        group: "g5",
        color: "white",
        label: status ?? "-",
      };
  }
};

export function ApplicationRoundStatusTag({
  status,
}: {
  status: ApplicationRoundStatusChoice;
}): JSX.Element {
  const { t } = useTranslation();
  if (!status) {
    return <Tag>{t("ApplicationRound.statuses.unknown")}</Tag>;
  }

  const convertedStatus = getApplicationRoundStatus(status);
  return (
    <Tag
      theme={{
        "--tag-background": convertedStatus.color,
      }}
    >
      {t(`ApplicationRound.statuses.${convertedStatus.label}`)}
    </Tag>
  );
}
