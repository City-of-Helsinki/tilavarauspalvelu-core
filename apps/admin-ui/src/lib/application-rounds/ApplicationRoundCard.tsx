import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { IconArrowRight, IconCalendar, IconSize } from "hds-react";
import { type ApplicationRoundCardFragment } from "@gql/gql-types";
import { formatDateRange } from "common/src/date-utils";
import { ApplicationRoundStatusLabel } from "./ApplicationRoundStatusLabel";
import { getApplicationRoundUrl } from "@/common/urls";
import { TimeframeStatus } from "./TimeframeStatus";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { Flex, fontMedium } from "common/styled";
import { Card } from "common/src/components";
import { gql } from "@apollo/client";

const Times = styled(Flex).attrs({
  $gap: "m",
  $direction: "row",
  $wrap: "wrap",
  $justifyContent: "space-between",
})`
  padding-bottom: var(--spacing-s);
`;

const Number = styled.span`
  font-size: var(--fontsize-body-xl);
  ${fontMedium}
`;

const Label = styled.span`
  font-size: var(--fontsize-body-s);
`;

function ReservationPeriod({
  reservationPeriodBeginDate,
  reservationPeriodEndDate,
}: {
  reservationPeriodBeginDate: string;
  reservationPeriodEndDate: string;
}): JSX.Element {
  return (
    <Flex $gap="xs" $direction="row" $alignItems="center">
      <IconCalendar size={IconSize.ExtraSmall} />
      {formatDateRange(new Date(reservationPeriodBeginDate), new Date(reservationPeriodEndDate), {
        includeWeekday: false,
      })}
    </Flex>
  );
}

function Stat({ value, label }: { value: number; label: string }): JSX.Element {
  return (
    <div>
      <Number>{value}</Number>
      <Label> {label}</Label>
    </div>
  );
}

interface ApplicationCardProps {
  applicationRound: NonNullable<ApplicationRoundCardFragment>;
}

export function ApplicationRoundCard({ applicationRound }: ApplicationCardProps): JSX.Element {
  const { t } = useTranslation();

  const name = applicationRound.nameFi;

  const buttons = [
    <ButtonLikeLink href={getApplicationRoundUrl(applicationRound.pk)} width="full" key="view">
      <span>{t("common:view")}</span>
      <IconArrowRight size={IconSize.Medium} />
    </ButtonLikeLink>,
  ];

  const tags = [<ApplicationRoundStatusLabel status={applicationRound.status} key="status" />];

  return (
    <Card heading={name ?? "-"} buttons={buttons} tags={tags}>
      <Times>
        <TimeframeStatus
          applicationPeriodBeginsAt={applicationRound.applicationPeriodBeginsAt}
          applicationPeriodEndsAt={applicationRound.applicationPeriodEndsAt}
        />
        <ReservationPeriod
          reservationPeriodBeginDate={applicationRound.reservationPeriodBeginDate}
          reservationPeriodEndDate={applicationRound.reservationPeriodEndDate}
        />
      </Times>
      <Flex $gap="m" $direction="row" $justifyContent="space-between">
        <Stat
          value={applicationRound.reservationUnitCount ?? 0}
          label={t("applicationRound:reservationUnitCount", {
            count: applicationRound.reservationUnitCount ?? 0,
          })}
        />
        <Stat
          value={applicationRound.applicationsCount ?? 0}
          label={t("applicationRound:applicationCount", {
            count: applicationRound.applicationsCount ?? 0,
          })}
        />
      </Flex>
    </Card>
  );
}

export const APPLICATION_ROUND_CARD_FRAGMENT = gql`
  fragment ApplicationRoundCard on ApplicationRoundNode {
    id
    pk
    nameFi
    status
    applicationPeriodBeginsAt
    applicationPeriodEndsAt
    reservationPeriodBeginDate
    reservationPeriodEndDate
    reservationUnitCount
    applicationsCount
  }
`;
