import React from "react";
import { differenceInWeeks } from "date-fns";
import { IconCalendar, IconClock, IconGroup } from "hds-react";
import { Trans, useTranslation } from "next-i18next";
import styled from "styled-components";
import { Flex, H4 } from "common/styled";
import { formatDuration, fromUIDate } from "common/src/common/util";
import { type ApplicationSectionPage1FormValues } from "./form";
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

function getHours(start: Date | null, end: Date | null, eventsPerWeek: number, minDurationMinutes: number) {
  if (!start || !end) {
    return 0;
  }
  const numWeeks = differenceInWeeks(end, start);

  const hours = (numWeeks * eventsPerWeek * minDurationMinutes) / 60;
  return hours;
}

type Props = {
  applicationSection: SectionFormValues | undefined;
  name: string;
};
type SectionFormValues = Pick<
  ApplicationSectionPage1FormValues,
  "begin" | "end" | "appliedReservationsPerWeek" | "minDuration" | "maxDuration" | "numPersons"
>;

export function ApplicationSectionSummary({ applicationSection, name }: Props): JSX.Element | null {
  const { t } = useTranslation();

  if (!applicationSection) {
    return null;
  }

  const { begin, end, appliedReservationsPerWeek, minDuration, maxDuration, numPersons } = applicationSection;

  if (!begin || !end || !minDuration || !maxDuration) {
    return null;
  }

  const hours = getHours(fromUIDate(begin), fromUIDate(end), appliedReservationsPerWeek ?? 1, minDuration / 60);

  const icons = [
    {
      icon: <IconGroup style={{ flexShrink: 0 }} />,
      text: t("applicationSectionSummary:numPersons", {
        count: numPersons ?? 0,
      }),
    },
    {
      icon: <IconClock style={{ flexShrink: 0 }} />,
      text: t(`applicationSectionSummary:${minDuration === maxDuration ? "minDuration" : "durations"}`, {
        minDuration: formatDuration(t, { seconds: minDuration }, false),
        maxDuration: formatDuration(t, { seconds: maxDuration }, false),
      }),
    },
    {
      icon: <IconCalendar style={{ flexShrink: 0 }} />,
      text: t("applicationSectionSummary:eventsPerWeek", {
        count: appliedReservationsPerWeek ?? 1,
      }),
    },
  ];

  return (
    <>
      <H4 as="h3">{t("applicationSectionSummary:title")}</H4>
      <Box>
        <Message>
          <Trans
            i18nKey="applicationSectionSummary:message"
            defaults="Olet tekemässä varausta {{ name }} kaudeksi <bold>{{startDate}}–{{endDate}}</bold>."
            values={{ name, startDate: begin, endDate: end }}
            components={{ bold: <strong /> }}
          />
        </Message>
        <Message>
          <Trans
            i18nKey="applicationSectionSummary:time_summary"
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
