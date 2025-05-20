import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { fontBold, H4 } from "common/styled";
import { breakpoints, WEEKDAYS } from "common/src/const";
import { fromMondayFirstUnsafe } from "common/src/helpers";
import {
  formatDayTimes,
  type ApplicationPage2FormValues,
  type SuitableTimeRangeFormValues,
} from "./form";
import { useFormContext } from "react-hook-form";
import { Priority } from "@/gql/gql-types";

type Props = {
  index: number;
};

const WeekWrapper = styled.div`
  display: flex;
  line-height: 2.2;
`;

const Label = styled.div`
  ${fontBold};
  padding-right: 4px;
  max-width: 10ch;
  width: 100%;
`;

function Weekdays({ schedules }: { schedules: SuitableTimeRangeFormValues[] }) {
  const { t } = useTranslation();
  return (
    <>
      {WEEKDAYS.map((day) => ({
        day,
        times: formatDayTimes(schedules, day),
      })).map(({ day, times }) => (
        <WeekWrapper key={day}>
          <Label>
            {t(`common:weekDayLong.${fromMondayFirstUnsafe(day)}`)}
            {times && ":"}
          </Label>
          <div>{times}</div>
        </WeekWrapper>
      ))}
    </>
  );
}

const Wrapper = styled.div`
  border: 2px solid var(--color-black);
  padding: var(--spacing-m);
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Heading = styled(H4).attrs({
  as: "div",
})`
  ${fontBold};
  margin-top: 0;
`;

export function TimePreview({ index }: Props): JSX.Element {
  const { t } = useTranslation();

  const { watch } = useFormContext<ApplicationPage2FormValues>();

  const schedules = watch(`applicationSections.${index}.suitableTimeRanges`);
  const primary = schedules.filter((n) => n.priority === Priority.Primary);
  const secondary = schedules.filter((n) => n.priority === Priority.Secondary);

  return (
    <Wrapper>
      <div>
        <Heading>{t("application:Page2.primarySchedules")}</Heading>
        <Weekdays schedules={primary} />
      </div>
      <div>
        <Heading>{t("application:Page2.secondarySchedules")}</Heading>
        <Weekdays schedules={secondary} />
      </div>
    </Wrapper>
  );
}
