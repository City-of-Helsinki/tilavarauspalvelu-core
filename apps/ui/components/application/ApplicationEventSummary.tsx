import { differenceInWeeks } from "date-fns";
import { IconCalendar, IconClock, IconGroup } from "hds-react";
import React from "react";
import { Trans, useTranslation, TFunction } from "next-i18next";
import styled from "styled-components";
import { H5 } from "common/src/common/typography";
import { fromUIDate } from "common/src/common/util";
import { ApplicationSectionFormValue } from "./Form";
import { Flex } from "common/styles/util";
import { IconWithText } from "../common/IconWithText";

type Props = {
  applicationSection?: ApplicationSectionFormValue;
  name: string;
};

const Message = styled.p`
  margin-top: 0;
`;

const SubHeadLine = styled(H5).attrs({
  as: "h2",
})`
  margin-top: var(--spacing-layout-m);
`;

const Box = styled(Flex).attrs({
  $gap: "xs",
})`
  border: 2px solid var(--color-black);
  padding: var(--spacing-l) var(--spacing-m);
`;

const numHours = (
  startDate: string | undefined,
  endDate: string | undefined,
  eventsPerWeek: number,
  minDurationMinutes: number
) => {
  if (!startDate || !endDate) {
    return 0;
  }
  const sd = fromUIDate(startDate);
  const ed = fromUIDate(endDate);
  if (!sd || !ed) {
    return 0;
  }
  const numWeeks = differenceInWeeks(ed, sd);

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

export function ApplicationEventSummary({
  applicationSection,
  name,
}: Props): JSX.Element | null {
  const { t } = useTranslation();

  if (!applicationSection) {
    return null;
  }

  const {
    begin,
    end,
    appliedReservationsPerWeek,
    minDuration,
    maxDuration,
    numPersons,
  } = applicationSection;

  const hours = numHours(
    begin,
    end,
    appliedReservationsPerWeek,
    minDuration / 60
  );

  if (!begin || !end || !minDuration) {
    return null;
  }

  const icons = [
    {
      icon: <IconGroup aria-hidden="true" style={{ flexShrink: 0 }} />,
      text: t("applicationEventSummary:numPersons", {
        count: numPersons ?? 0,
      }),
    },
    {
      icon: <IconClock aria-hidden="true" style={{ flexShrink: 0 }} />,
      text: t(
        `applicationEventSummary:${
          minDuration === maxDuration ? "minDuration" : "durations"
        }`,
        {
          minDuration: displayDuration(applicationSection.minDuration, t),
          maxDuration: displayDuration(applicationSection.maxDuration, t),
        }
      ),
    },
    {
      icon: <IconCalendar aria-hidden="true" style={{ flexShrink: 0 }} />,
      text: t("applicationEventSummary:eventsPerWeek", {
        count: appliedReservationsPerWeek,
      }),
    },
  ];

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
        {icons.map((icon) => (
          <IconWithText key={icon.text} {...icon} />
        ))}
      </Box>
    </>
  );
}
