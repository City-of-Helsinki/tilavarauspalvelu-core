import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { IconArrowRight, IconCalendar, IconSize } from "hds-react";
import { type ApplicationRoundsQuery } from "@gql/gql-types";
import { formatDate } from "@/common/util";
import { ApplicationRoundStatusLabel } from "./ApplicationRoundStatusLabel";
import { getApplicationRoundUrl } from "@/common/urls";
import TimeframeStatus from "./TimeframeStatus";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { Flex } from "common/styles/util";
import { Card } from "common/src/components";
import { fontMedium } from "common";

type ApplicationRoundListType = NonNullable<
  ApplicationRoundsQuery["applicationRounds"]
>;
type ApplicationRoundType = NonNullable<
  NonNullable<ApplicationRoundListType["edges"]>[0]
>["node"];

interface IProps {
  applicationRound: NonNullable<ApplicationRoundType>;
}

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
  reservationPeriodBegin,
  reservationPeriodEnd,
}: {
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
}): JSX.Element {
  return (
    <Flex $gap="xs" $direction="row" $alignItems="center">
      <IconCalendar size={IconSize.ExtraSmall} />
      {formatDate(reservationPeriodBegin)}-{formatDate(reservationPeriodEnd)}
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

export function ApplicationRoundCard({
  applicationRound,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  const name = applicationRound.nameFi;

  const buttons = [
    <ButtonLikeLink
      to={getApplicationRoundUrl(applicationRound.pk)}
      width="full"
      key="view"
    >
      <span>{t("common.view")}</span>
      <IconArrowRight size={IconSize.Medium} />
    </ButtonLikeLink>,
  ];

  const tags = [
    <ApplicationRoundStatusLabel
      status={applicationRound.status}
      key="status"
    />,
  ];

  return (
    <Card heading={name ?? "-"} buttons={buttons} tags={tags}>
      <Times>
        <TimeframeStatus
          applicationPeriodBegin={applicationRound.applicationPeriodBegin}
          applicationPeriodEnd={applicationRound.applicationPeriodEnd}
        />
        <ReservationPeriod
          reservationPeriodBegin={applicationRound.reservationPeriodBegin}
          reservationPeriodEnd={applicationRound.reservationPeriodEnd}
        />
      </Times>
      <Flex $gap="m" $direction="row" $justifyContent="space-between">
        <Stat
          value={applicationRound.reservationUnitCount ?? 0}
          label={t("ApplicationRound.reservationUnitCount", {
            count: applicationRound.reservationUnitCount ?? 0,
          })}
        />
        <Stat
          value={applicationRound.applicationsCount ?? 0}
          label={t("ApplicationRound.applicationCount", {
            count: applicationRound.applicationsCount ?? 0,
          })}
        />
      </Flex>
    </Card>
  );
}
