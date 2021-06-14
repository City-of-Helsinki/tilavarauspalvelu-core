import { differenceInWeeks } from "date-fns";
import { IconArrowRedo, IconCalendar, IconClock, IconGroup } from "hds-react";
import { TFunction } from "i18next";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { ApplicationEvent } from "../../modules/types";
import { apiDurationToMinutes, fromUIDate } from "../../modules/util";
import { TwoColumnContainer } from "../common/common";
import IconWithText from "../common/IconWithText";

type Props = {
  applicationEvent: ApplicationEvent;
  name: string;
};

const Message = styled.div`
  margin-top: var(--spacing-s);
  font-size: var(--fontsize-body-xl);
`;

const CustomIconWithText = styled(IconWithText)`
  font-size: var(--fontsize-body-l);
`;

const SubHeadLine = styled.h2`
  font-family: var(--font-bold);
  margin-top: var(--spacing-layout-m);
  font-weight: 700;
  font-size: var(--fontsize-heading-m);
`;

const numHours = (
  startDate: string,
  endDate: string,
  biweekly: boolean,
  eventsPerWeek: number,
  minDurationMinutes: number
) => {
  const numWeeks =
    differenceInWeeks(fromUIDate(endDate), fromUIDate(startDate)) /
    (biweekly ? 2 : 1);

  const hours = (numWeeks * eventsPerWeek * minDurationMinutes) / 60;
  return hours;
};

function displayDuration(applicationEvent: ApplicationEvent, t: TFunction) {
  const displayHours = Number(
    (applicationEvent.minDuration || "00:00:00").split(":")[0]
  );
  const displayMinutes = Number(
    (applicationEvent.minDuration || "00:00:00").split(":")[1]
  );

  return `${displayHours} ${t("common:abbreviations.hour")} ${
    displayMinutes ? displayMinutes + t("common:abbreviations.minute") : ""
  }`;
}

const ApplicationEventSummary = ({
  applicationEvent,
  name,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  if (!applicationEvent) {
    return null;
  }

  const begin = applicationEvent.begin as string;
  const end = applicationEvent.end as string;
  const biweekly = Boolean(applicationEvent.biweekly);
  const eventsPerWeek = Number(applicationEvent.eventsPerWeek);
  const minDuration = apiDurationToMinutes(
    applicationEvent.minDuration || "00:00:00"
  );
  const numPersons = Number(applicationEvent.numPersons);

  if (!begin || !end || !minDuration) {
    return null;
  }

  return (
    <>
      <SubHeadLine>
        {t("application:Page1.applicationEventSummary")}
      </SubHeadLine>

      <Message>
        {t("applicationEventSummary:message", {
          name,
          startDate: begin,
          endDate: end,
          hours: numHours(begin, end, biweekly, eventsPerWeek, minDuration),
        })}
      </Message>
      <TwoColumnContainer>
        <CustomIconWithText
          icon={<IconGroup aria-hidden />}
          text={
            <Trans
              i18nKey="applicationEventSummary:numPersons"
              count={numPersons}
            >
              Ryhmän koko on <strong>{{ numPersons }}</strong>
            </Trans>
          }
        />
        <CustomIconWithText
          icon={<IconClock aria-hidden />}
          text={t("applicationEventSummary:minDuration", {
            minDuration: displayDuration(applicationEvent, t),
          })}
        />
        <CustomIconWithText
          icon={<IconCalendar aria-hidden />}
          text={
            <Trans
              count={eventsPerWeek}
              i18nKey="applicationEventSummary:eventsPerWeek"
            >
              <strong>{{ eventsPerWeek }}</strong> vuoro viikossa
            </Trans>
          }
        />
        {biweekly ? (
          <CustomIconWithText
            icon={<IconArrowRedo />}
            text={<strong>{t("application:Page1.biweekly")}</strong>}
          />
        ) : null}
      </TwoColumnContainer>
    </>
  );
};
export default ApplicationEventSummary;
