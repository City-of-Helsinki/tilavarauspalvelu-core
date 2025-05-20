import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { fontBold, H4 } from "../../styled";
import { breakpoints, WEEKDAYS } from "../const";
import { fromMondayFirstUnsafe, formatDayTimes } from "../helpers";
import { Priority, SuitableTimeFragment } from "../../gql/gql-types";

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

function Weekdays({
  schedules,
}: {
  schedules: Omit<SchedulesT, "priority">[];
}) {
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

const Container = styled.div`
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

type SchedulesT = Omit<SuitableTimeFragment, "pk" | "id">;

export function ApplicationTimePreview({
  schedules,
}: {
  schedules: readonly SchedulesT[];
}): JSX.Element {
  const { t } = useTranslation();

  const primary = schedules.filter((n) => n.priority === Priority.Primary);
  const secondary = schedules.filter((n) => n.priority === Priority.Secondary);

  return (
    <Container>
      <div>
        <Heading>{t("application:primarySchedules")}</Heading>
        <Weekdays schedules={primary} />
      </div>
      <div>
        <Heading>{t("application:secondarySchedules")}</Heading>
        <Weekdays schedules={secondary} />
      </div>
    </Container>
  );
}
