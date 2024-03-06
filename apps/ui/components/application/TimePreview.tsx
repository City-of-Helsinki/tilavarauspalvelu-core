import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { fontBold, H4 } from "common/src/common/typography";
import { fromMondayFirstUnsafe } from "common/src/helpers";
import { WEEKDAYS } from "common/src/const";
import { ApplicationEventScheduleFormType } from "./Form";

type Props = {
  primary: ApplicationEventScheduleFormType[];
  secondary: ApplicationEventScheduleFormType[];
};

const WeekWrapper = styled.div`
  display: flex;
  line-height: 2.2;
`;

const Label = styled.div`
  ${fontBold};
  padding-right: 4px;
`;

function Weekdays({
  schedules,
}: {
  schedules: ApplicationEventScheduleFormType[];
}) {
  const { t } = useTranslation();
  return (
    <>
      {WEEKDAYS.map((day) => {
        const value = schedules
          .filter((s) => s.day === day)
          .map(
            (cur) =>
              `${Number(cur.begin.substring(0, 2))}-${Number(
                cur.end.startsWith("00") ? 24 : cur.end.substring(0, 2)
              )}`
          )
          .join(", ");
        return (
          <WeekWrapper key={day}>
            <Label>
              {t(`common:weekDayLong.${fromMondayFirstUnsafe(day)}`)}
              {value && ":"}
            </Label>
            <div>{value}</div>
          </WeekWrapper>
        );
      })}
    </>
  );
}

const Wrapper = styled.div`
  border: 2px solid var(--color-black);
  padding: var(--spacing-m);
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-l);
  background: var(--color-white);

  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Heading = styled(H4).attrs({
  as: "div",
})`
  ${fontBold};
  font-size: var(--fontsize-heading-s);
  margin-top: 0;
`;

const TimePreview = ({ primary, secondary }: Props): JSX.Element => {
  const { t } = useTranslation();

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
};

export { TimePreview };
