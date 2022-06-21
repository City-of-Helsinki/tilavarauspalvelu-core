import { Tag } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ApplicationRoundStatus,
  ApplicationRoundType,
} from "../../common/gql-types";

interface IProps {
  applicationRound: ApplicationRoundType;
}

type RoundStatus = {
  color: string;
  label: string;
  group: string;
};

export const getApplicationRoundStatusTag = (
  applicationRound: ApplicationRoundType
): RoundStatus => {
  const cutOffDate = new Date();
  switch (applicationRound.status) {
    case ApplicationRoundStatus.InReview:
      return {
        group: "g1",
        color: "var(--color-gold-medium-light)",
        label: "review",
      };
    case ApplicationRoundStatus.ReviewDone:
      return {
        group: "g1",
        color: "var(--color-info-light)",
        label: "handling",
      };
    case ApplicationRoundStatus.Handled:
      return { group: "g2", color: "var(--color-bus-light)", label: "handled" };
    case ApplicationRoundStatus.Draft: {
      if (cutOffDate < new Date(applicationRound.applicationPeriodBegin)) {
        return {
          group: "g4",
          color: "var(--color-engel-light)",
          label: "upcoming",
        };
      }

      if (cutOffDate > new Date(applicationRound.applicationPeriodEnd)) {
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
      return { group: "g5", color: "white", label: "not implemented" };
  }
};

function ApplicationRoundStatusTag({ applicationRound }: IProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <Tag
      theme={{
        "--tag-background":
          getApplicationRoundStatusTag(applicationRound).color,
      }}
    >
      {t(
        `ApplicationRound.statuses.${
          getApplicationRoundStatusTag(applicationRound).label
        }`
      )}
    </Tag>
  );
}

export default ApplicationRoundStatusTag;
