import React from "react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import { Priority } from "../../gql/gql-types";
import type { SuitableTimeFragment } from "../../gql/gql-types";
import { WEEKDAYS } from "../modules/const";
import { convertWeekday } from "../modules/conversion";
import { setSundayFirst } from "../modules/date-utils";
import { formatApiTimeInterval } from "../modules/helpers";
import { AutoGrid, fontBold } from "../styled";
import { visuallyHidden } from "./CalendarGrid/styles";

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

const InvalidTime = styled.span`
  color: var(--color-error);
`;

const HiddenText = styled.span`
  ${visuallyHidden};
`;

function Weekdays({
  schedules,
  invalidSchedules,
}: {
  schedules: ReadonlyArray<SchedulesT>;
  invalidSchedules: ReadonlySet<SchedulesT>;
}) {
  const { t } = useTranslation();
  return (
    <>
      {WEEKDAYS.map((day) => ({
        day,
        times: schedules.filter((s) => convertWeekday(s.dayOfTheWeek) === day),
      })).map(({ day, times }) => (
        <WeekWrapper key={day}>
          <Label>
            {t(`common:weekDay.${setSundayFirst(day)}`)}
            {times.length > 0 && ":"}
          </Label>
          <div>
            {times.map((time, i) => {
              const text = formatApiTimeInterval(time);
              return (
                <React.Fragment key={text}>
                  {i > 0 && ", "}
                  {invalidSchedules.has(time) ? (
                    <InvalidTime data-invalid>
                      {text}
                      {/* The colour alone doesn't tell it to everyone. */}
                      <HiddenText> ({t("application:TimeSelector.legend.invalid")})</HiddenText>
                    </InvalidTime>
                  ) : (
                    text
                  )}
                </React.Fragment>
              );
            })}
          </div>
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

export function ApplicationTimePreview({
  schedules,
  invalidSchedules = [],
}: {
  schedules: ReadonlyArray<SchedulesT>;
  /** Items of `schedules` to show as invalid, in the error colour. */
  invalidSchedules?: ReadonlyArray<SchedulesT>;
}): React.ReactElement {
  const { t } = useTranslation();
  const invalid = new Set(invalidSchedules);

  const primary = schedules.filter((n) => n.priority === Priority.Primary);
  const secondary = schedules.filter((n) => n.priority === Priority.Secondary);

  return (
    // Extra div so the inner container is not full height but scales by content
    <div>
      <Container>
        <div>
          <Heading>{t("application:primarySchedules")}</Heading>
          <Weekdays schedules={primary} invalidSchedules={invalid} />
        </div>
        <div>
          <Heading>{t("application:secondarySchedules")}</Heading>
          <Weekdays schedules={secondary} invalidSchedules={invalid} />
        </div>
      </Container>
    </div>
  );
}
