import React from "react";
import { gql } from "@apollo/client";
import { isValid } from "date-fns";
import { IconArrowRight, IconLinkExternal } from "hds-react";
import { type TFunction, useTranslation } from "next-i18next";
import { Card } from "ui/src/components";
import { ButtonLikeLink } from "ui/src/components/ButtonLikeLink";
import { formatDateTime, formatDate } from "ui/src/modules/date-utils";
import type { LocalizationLanguages } from "ui/src/modules/urlBuilder";
import { getTranslation } from "ui/src/modules/util";
import { getLocalizationLang } from "@ui/modules/helpers";
import { getApplicationRoundPath } from "@/modules/urls";
import { type ApplicationRoundCardFragment, ApplicationRoundStatusChoice } from "@gql/gql-types";

interface CardProps {
  applicationRound: ApplicationRoundCardFragment;
}

function translateRoundDate(
  t: TFunction,
  locale: LocalizationLanguages,
  round: Pick<ApplicationRoundCardFragment, "applicationPeriodBeginsAt" | "applicationPeriodEndsAt" | "status">
) {
  const begin = new Date(round.applicationPeriodBeginsAt);
  const end = new Date(round.applicationPeriodEndsAt);
  if (!isValid(begin) || !isValid(end)) {
    return "";
  }

  switch (round.status) {
    case ApplicationRoundStatusChoice.Upcoming:
      return t("applicationRound:card.pending", {
        opening: formatDateTime(begin, { t, locale }),
      });
    case ApplicationRoundStatusChoice.Open:
      return t("applicationRound:card.open", { until: formatDateTime(end, { t, locale }) });
    default:
      return t("applicationRound:card.past", {
        closing: formatDateTime(end, { t, locale }),
      });
  }
}

export function ApplicationRoundCard({ applicationRound }: Readonly<CardProps>): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = getLocalizationLang(i18n.language);

  const name = getTranslation(applicationRound, "name", lang);
  const timeString = translateRoundDate(t, lang, applicationRound);
  const begin = new Date(applicationRound.reservationPeriodBeginDate);
  const end = new Date(applicationRound.reservationPeriodEndDate);
  const reservationPeriodBeginDate = formatDate(begin);
  const reservationPeriodEndDate = formatDate(end);

  const reservationPeriod = t(`applicationRound:card.reservationPeriod`, {
    reservationPeriodBeginDate,
    reservationPeriodEndDate,
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
    reservationPeriodBeginDate
    reservationPeriodEndDate
    applicationPeriodBeginsAt
    applicationPeriodEndsAt
    status
  }
`;
