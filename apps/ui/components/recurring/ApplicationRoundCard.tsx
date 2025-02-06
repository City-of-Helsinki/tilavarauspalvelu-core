import React from "react";
import { IconArrowRight, IconLinkExternal } from "hds-react";
import { type TFunction, useTranslation } from "next-i18next";
import {
  type ApplicationRoundFieldsFragment,
  ApplicationRoundStatusChoice,
} from "@gql/gql-types";
import { formatDateTime } from "@/modules/util";
import { isValid } from "date-fns";
import Card from "common/src/components/Card";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";
import { getApplicationRoundPath } from "@/modules/urls";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";

interface CardProps {
  applicationRound: ApplicationRoundFieldsFragment;
}

function translateRoundDate(
  t: TFunction,
  round: ApplicationRoundFieldsFragment
) {
  const begin = new Date(round.applicationPeriodBegin);
  const end = new Date(round.applicationPeriodEnd);
  if (!isValid(begin) || !isValid(end)) {
    // eslint-disable-next-line no-console
    console.warn("Invalid application period dates");
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
      // TODO no time here
      return t("applicationRound:card.past", {
        closing: formatDateTime(t, end),
      });
  }
}

export function ApplicationRoundCard({
  applicationRound,
}: CardProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  const state = applicationRound.status;
  const name = getTranslationSafe(applicationRound, "name", lang);
  const timeString = translateRoundDate(t, applicationRound);
  const reservationPeriod = t(`applicationRound:card.reservationPeriod`, {
    // TODO check if time is needed
    reservationPeriodBegin: formatDateTime(
      t,
      new Date(applicationRound.reservationPeriodBegin)
    ),
    reservationPeriodEnd: formatDateTime(
      t,
      new Date(applicationRound.reservationPeriodEnd)
    ),
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
  if (state === ApplicationRoundStatusChoice.Open) {
    buttons.push(
      <ButtonLikeLink
        key="button"
        href={getApplicationRoundPath(applicationRound.pk)}
        width="full"
      >
        {t("application:Intro.startNewApplication")}
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
