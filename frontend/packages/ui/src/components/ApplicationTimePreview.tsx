import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Priority, SuitableTimeFragment } from "../../gql/gql-types";
import { WEEKDAYS } from "../modules/const";
import { setSundayFirst } from "../modules/date-utils";
import { formatDayTimes } from "../modules/helpers";
import { AutoGrid, fontBold } from "../styled";

const WeekWrapper = styled.div`
  display: flex;
  line-height: 1.8;
`;

const Label = styled.div`
  ${fontBold};
  padding-right: 4px;
  max-width: 4ch;
  width: 100%;
`;

function Weekdays({ schedules }: { schedules: Omit<SchedulesT, "priority">[] }) {
  const { t } = useTranslation();
  return (
    <>
      {WEEKDAYS.map((day) => ({
        day,
        times: formatDayTimes(schedules, day),
      })).map(({ day, times }) => (
        <WeekWrapper key={day}>
          <Label>
            {t(`common:weekDay.${setSundayFirst(day)}`)}
            {times && ":"}
          </Label>
          <div>{times}</div>
        </WeekWrapper>
      ))}
    </>
  );
}

const Container = styled(AutoGrid)`
  border: 1px solid var(--color-black-50);
  padding: var(--spacing-s) var(--spacing-m);
`;

const Heading = styled.p.attrs({ as: "h4" })`
  ${fontBold};
  margin: 0 0 var(--spacing-xs);
`;

type SchedulesT = Omit<SuitableTimeFragment, "pk" | "id">;

export function ApplicationTimePreview({ schedules }: { schedules: readonly SchedulesT[] }): JSX.Element {
  const { t } = useTranslation();

  const primary = schedules.filter((n) => n.priority === Priority.Primary);
  const secondary = schedules.filter((n) => n.priority === Priority.Secondary);

  return (
    // Extra div so the inner container is not full height but scales by content
    <div>
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
    </div>
  );
}
