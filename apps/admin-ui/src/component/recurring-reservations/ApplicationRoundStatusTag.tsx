import { Tag } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { ApplicationRoundStatus } from "common/types/gql-types";

type RoundStatus = {
  color: string;
  label: string;
  group: string;
};

export const getApplicationRoundStatus = (
  status: ApplicationRoundStatus | undefined,
  start: Date,
  end: Date
): RoundStatus => {
  const cutOffDate = new Date();

  switch (status) {
    case ApplicationRoundStatus.InReview:
      return {
        group: "g1",
        color: "var(--color-gold-medium-light)",
        label: "review",
      };
    case ApplicationRoundStatus.ReviewDone:
    case ApplicationRoundStatus.Allocated:
      return {
        group: "g1",
        color: "var(--color-info-light)",
        label: "handling",
      };
    case ApplicationRoundStatus.Handled:
      return { group: "g2", color: "var(--color-bus-light)", label: "handled" };
    case ApplicationRoundStatus.Draft: {
      if (cutOffDate < start) {
        return {
          group: "g4",
          color: "var(--color-engel-light)",
          label: "upcoming",
        };
      }

      if (cutOffDate > end) {
        return {
          group: "g1",
          color: "var(--color-info-light)",
          label: "handling",
        };
      }

      return { group: "g3", color: "var(--color-brick-light)", label: "open" };
    }
    case ApplicationRoundStatus.Sent:
      return { group: "g5", color: "var(--color-black-05)", label: "sent" };
    default:
      return {
        group: "g5",
        color: "white",
        label: status ?? "-",
      };
  }
};

function ApplicationRoundStatusTag({
  status,
  start,
  end,
}: {
  status: ApplicationRoundStatus;
  start: Date;
  end: Date;
}): JSX.Element {
  const { t } = useTranslation();
  if (!status) {
    return <Tag>{t("ApplicationRound.statuses.unknown")}</Tag>;
  }

  const convertedStatus = getApplicationRoundStatus(status, start, end);
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

export default ApplicationRoundStatusTag;
