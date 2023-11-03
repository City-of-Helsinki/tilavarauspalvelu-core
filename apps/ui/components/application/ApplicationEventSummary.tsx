import { differenceInWeeks } from "date-fns";
import { IconArrowRedo, IconCalendar, IconClock, IconGroup } from "hds-react";
import React from "react";
import { Trans, useTranslation, TFunction } from "next-i18next";
import styled from "styled-components";
import { H5 } from "common/src/common/typography";
import { fromUIDate } from "../../modules/util";
import IconWithText from "../common/IconWithText";
import { ApplicationEventFormValue } from "./Form";

type Props = {
  applicationEvent?: ApplicationEventFormValue;
  name: string;
};

const Message = styled.div`
  font-size: var(--fontsize-body-l);
  margin-bottom: var(--spacing-m);
`;

const CustomIconWithText = styled(IconWithText)`
  font-size: var(--fontsize-body-m);
  margin-top: var(--spacing-2-xs);
`;

const SubHeadLine = styled(H5).attrs({
  as: "h2",
})`
  margin-top: var(--spacing-layout-m);
`;

const Box = styled.div`
  border: 2px solid var(--color-black);
  padding: var(--spacing-l) var(--spacing-m);
  white-space: pre-line;
  line-height: var(--lineheight-xl);
`;

const numHours = (
  startDate: string | undefined,
  endDate: string | undefined,
  biweekly: boolean,
  eventsPerWeek: number,
  minDurationMinutes: number
) => {
  if (!startDate || !endDate) {
    return 0;
  }
  const numWeeks =
    differenceInWeeks(fromUIDate(endDate), fromUIDate(startDate)) /
    (biweekly ? 2 : 1);

  const hours = (numWeeks * eventsPerWeek * minDurationMinutes) / 60;
  return hours;
};

function displayDuration(duration: number, t: TFunction) {
  if (!duration) {
    return "";
  }
  const durMinutes = duration / 60;
  const displayHours = Math.floor(durMinutes / 60);
  const displayMinutes = durMinutes % 60;

  return `${t("common:hour", { count: displayHours })} ${
    displayMinutes ? t("common:minute", { count: displayMinutes }) : ""
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

  const {
    begin,
    end,
    biweekly,
    eventsPerWeek,
    minDuration,
    maxDuration,
    numPersons,
  } = applicationEvent;
  const hours = numHours(begin, end, biweekly, eventsPerWeek, minDuration / 60);

  if (!begin || !end || !minDuration) {
    return null;
  }

  return (
    <>
      <SubHeadLine>
        {t("application:Page1.applicationEventSummary")}
      </SubHeadLine>
      <Box>
        <Message>
          <Trans
            i18nKey="applicationEventSummary:message"
            defaults="Olet tekemässä varausta {{ name }} kaudeksi  <bold>{{startDate}} - {{endDate}}</bold>.<br />Varausten yhteenlaskettu kesto on vähintään  <bold>{{hours}} tuntia</bold>."
            count={hours}
            values={{ name, startDate: begin, endDate: end, hours }}
            components={{ bold: <strong />, br: <br /> }}
          />
        </Message>
        <CustomIconWithText
          icon={<IconGroup aria-hidden />}
          text={t("applicationEventSummary:numPersons", {
            count: numPersons ?? 0,
          })}
        />
        <CustomIconWithText
          icon={<IconClock aria-hidden />}
          text={t(
            `applicationEventSummary:${
              minDuration === maxDuration ? "minDuration" : "durations"
            }`,
            {
              minDuration: displayDuration(applicationEvent.minDuration, t),
              maxDuration: displayDuration(applicationEvent.maxDuration, t),
            }
          )}
        />
        <CustomIconWithText
          icon={<IconCalendar aria-hidden />}
          text={t("applicationEventSummary:eventsPerWeek", {
            count: eventsPerWeek,
          })}
        />
        {biweekly ? (
          <CustomIconWithText
            icon={<IconArrowRedo aria-hidden />}
            text={<strong>{t("application:Page1.biweekly")}</strong>}
          />
        ) : null}
      </Box>
    </>
  );
};
export { ApplicationEventSummary };
