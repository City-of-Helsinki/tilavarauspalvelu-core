import { differenceInWeeks } from "date-fns";
import { IconCalendar, IconClock, IconGroup } from "hds-react";
import React from "react";
import { Trans, useTranslation, TFunction } from "next-i18next";
import styled from "styled-components";
import { H4 } from "common/src/common/typography";
import { fromUIDate } from "common/src/common/util";
import { type ApplicationSectionPage1FormValues } from "./form";
import { Flex } from "common/styles/util";
import { IconWithText } from "@/components/common/IconWithText";

const Message = styled.p`
  margin: 0;
`;

const Box = styled(Flex).attrs({
  $gap: "xs",
})`
  border: 2px solid var(--color-black);
  padding: var(--spacing-l) var(--spacing-m);
`;

function getHours(
  startDate: string,
  endDate: string,
  eventsPerWeek: number,
  minDurationMinutes: number
) {
  const sd = fromUIDate(startDate);
  const ed = fromUIDate(endDate);
  if (!sd || !ed) {
    return 0;
  }
  const numWeeks = differenceInWeeks(ed, sd);

  const hours = (numWeeks * eventsPerWeek * minDurationMinutes) / 60;
  return hours;
}

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

type Props = {
  applicationSection: SectionFormValues | undefined;
  name: string;
};
type SectionFormValues = Pick<
  ApplicationSectionPage1FormValues,
  | "begin"
  | "end"
  | "appliedReservationsPerWeek"
  | "minDuration"
  | "maxDuration"
  | "numPersons"
>;

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

  if (!begin || !end || !minDuration || !maxDuration) {
    return null;
  }

  const hours = getHours(
    begin,
    end,
    appliedReservationsPerWeek,
    minDuration / 60
  );

  const icons = [
    {
      icon: <IconGroup style={{ flexShrink: 0 }} />,
      text: t("applicationEventSummary:numPersons", {
        count: numPersons ?? 0,
      }),
    },
    {
      icon: <IconClock style={{ flexShrink: 0 }} />,
      text: t(
        `applicationEventSummary:${
          minDuration === maxDuration ? "minDuration" : "durations"
        }`,
        {
          minDuration: displayDuration(minDuration, t),
          maxDuration: displayDuration(maxDuration, t),
        }
      ),
    },
    {
      icon: <IconCalendar style={{ flexShrink: 0 }} />,
      text: t("applicationEventSummary:eventsPerWeek", {
        count: appliedReservationsPerWeek,
      }),
    },
  ];

  return (
    <>
      <H4 as="h3">{t("application:Page1.applicationEventSummary")}</H4>
      <Box>
        <Message>
          <Trans
            i18nKey="applicationEventSummary:message"
            defaults="Olet tekemässä varausta {{ name }} kaudeksi <bold>{{startDate}}–{{endDate}}</bold>."
            values={{ name, startDate: begin, endDate: end }}
            components={{ bold: <strong /> }}
          />
        </Message>
        <Message>
          <Trans
            i18nKey="applicationEventSummary:time_summary"
            defaults="Varausten yhteenlaskettu kesto on vähintään <bold>{{hours}} tuntia</bold>."
            count={hours}
            values={{ hours }}
            components={{ bold: <strong /> }}
          />
        </Message>
        {icons.map((icon) => (
          <IconWithText key={icon.text} {...icon} />
        ))}
      </Box>
    </>
  );
}
