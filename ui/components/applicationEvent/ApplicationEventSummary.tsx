import { differenceInWeeks } from "date-fns";
import { IconArrowRedo, IconCalendar, IconClock, IconGroup } from "hds-react";
import React from "react";
import { Trans, useTranslation, TFunction } from "react-i18next";
import styled from "styled-components";
import { ApplicationEvent } from "common/types/common";
import { H5 } from "../../modules/style/typography";
import { apiDurationToMinutes, fromUIDate } from "../../modules/util";
import IconWithText from "../common/IconWithText";

type Props = {
  applicationEvent: ApplicationEvent;
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

function displayDuration(duration: string, t: TFunction) {
  const displayHours = Number((duration || "00:00:00").split(":")[0]);
  const displayMinutes = Number((duration || "00:00:00").split(":")[1]);

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

  const begin = applicationEvent.begin as string;
  const end = applicationEvent.end as string;
  const biweekly = Boolean(applicationEvent.biweekly);
  const eventsPerWeek = Number(applicationEvent.eventsPerWeek);
  const minDuration = apiDurationToMinutes(
    applicationEvent.minDuration || "00:00:00"
  );
  const maxDuration = apiDurationToMinutes(
    applicationEvent.maxDuration || "00:00:00"
  );
  const numPersons = Number(applicationEvent.numPersons);
  const hours = numHours(begin, end, biweekly, eventsPerWeek, minDuration);

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
          <Trans i18nKey="applicationEventSummary:message" count={hours}>
            Olet tekemässä varausta {{ name }} kaudeksi{" "}
            <strong>
              {{ startDate: begin }} - {{ endDate: end }}
            </strong>
            .\nVarausten yhteenlaskettu kesto on vähintään{" "}
            <strong>
              {{
                hours,
              }}{" "}
              tuntia
            </strong>
            .
          </Trans>
        </Message>
        <CustomIconWithText
          icon={<IconGroup aria-hidden />}
          text={t("applicationEventSummary:numPersons", { count: numPersons })}
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
export default ApplicationEventSummary;
