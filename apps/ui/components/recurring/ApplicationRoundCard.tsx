import React from "react";
import { IconArrowRight, IconLinkExternal } from "hds-react";
import { type TFunction, useTranslation } from "next-i18next";
import { type ApplicationRoundCardFragment, ApplicationRoundStatusChoice } from "@gql/gql-types";
import { formatDateTime } from "@/modules/util";
import { isValid } from "date-fns";
import Card from "common/src/components/Card";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";
import { getApplicationRoundPath } from "@/modules/urls";
import { convertLanguageCode, getTranslationSafe, toUIDate } from "common/src/common/util";
import { gql } from "@apollo/client";

interface CardProps {
  applicationRound: ApplicationRoundCardFragment;
}

function translateRoundDate(
  t: TFunction,
  round: Pick<ApplicationRoundCardFragment, "applicationPeriodBegin" | "applicationPeriodEnd" | "status">
) {
  const begin = new Date(round.applicationPeriodBegin);
  const end = new Date(round.applicationPeriodEnd);
  if (!isValid(begin) || !isValid(end)) {
    return "";
  }

  switch (round.status) {
    case ApplicationRoundStatusChoice.Upcoming:
      return t("applicationRound:card.pending", {
        opening: formatDateTime(t, begin),
      });
    case ApplicationRoundStatusChoice.Open:
      return t("applicationRound:card.open", { until: formatDateTime(t, end) });
    default:
      return t("applicationRound:card.past", {
        closing: formatDateTime(t, end),
      });
  }
}

export function ApplicationRoundCard({ applicationRound }: Readonly<CardProps>): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  const name = getTranslationSafe(applicationRound, "name", lang);
  const timeString = translateRoundDate(t, applicationRound);
  const begin = new Date(applicationRound.reservationPeriodBegin);
  const end = new Date(applicationRound.reservationPeriodEnd);
  const reservationPeriodBegin = toUIDate(begin);
  const reservationPeriodEnd = toUIDate(end);

  const reservationPeriod = t(`applicationRound:card.reservationPeriod`, {
    reservationPeriodBegin,
    reservationPeriodEnd,
  });

  const buttons = [
    <ButtonLikeLink
      href={getApplicationRoundPath(applicationRound.pk, "criteria")}
      target="_blank"
      key="criteria"
      width="full"
    >
      {t("applicationRound:card.criteria")}
      <IconLinkExternal />
    </ButtonLikeLink>,
  ];

  if (applicationRound.status === ApplicationRoundStatusChoice.Open) {
    buttons.push(
      <ButtonLikeLink key="button" href={getApplicationRoundPath(applicationRound.pk)} width="full">
        {t("applicationRound:startNewApplication")}
        <IconArrowRight />
      </ButtonLikeLink>
    );
  }

  return (
    <Card heading={name} text={timeString} buttons={buttons}>
      {reservationPeriod}
    </Card>
  );
}

export const APPLICATION_ROUND_CARD_FRAGMENT = gql`
  fragment ApplicationRoundCard on ApplicationRoundNode {
    id
    pk
    nameFi
    nameEn
    nameSv
    reservationPeriodBegin
    reservationPeriodEnd
    applicationPeriodBegin
    applicationPeriodEnd
    status
  }
`;
