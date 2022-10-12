import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ApplicationEventSchedule } from "common/types/common";
import { breakpoints } from "common/src/common/style";
import { fontBold, H4 } from "common/src/common/typography";
import { weekdays } from "../../modules/const";

type Props = {
  applicationEventSchedules: [
    ApplicationEventSchedule[],
    ApplicationEventSchedule[]
  ];
};

const WeekWrapper = styled.div`
  display: flex;
  line-height: 2.2;
`;

const Label = styled.div`
  ${fontBold};
  padding-right: 4px;
`;

const Weekdays = ({ schedules }) => {
  const { t } = useTranslation();
  return (
    <>
      {weekdays.map((day, index) => {
        const value = schedules
          .filter((s) => s.day === index)
          .map(
            (cur) =>
              `${Number(cur.begin.substring(0, 2))}-${Number(
                cur.end.substring(0, 2) === "00" ? 24 : cur.end.substring(0, 2)
              )}`
          )
          .join(", ");
        return (
          <WeekWrapper key={day}>
            <Label>
              {t(`calendar:${day}`)}
              {value && ":"}
            </Label>
            <div>{value}</div>
          </WeekWrapper>
        );
      })}
    </>
  );
};

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

const TimePreview = ({ applicationEventSchedules }: Props): JSX.Element => {
  const { t } = useTranslation();
  const [primarySchedules, secondarySchedules] = applicationEventSchedules;

  return (
    <Wrapper>
      <div>
        <Heading>{t("application:Page2.primarySchedules")}</Heading>
        <Weekdays schedules={primarySchedules} />
      </div>
      <div>
        <Heading>{t("application:Page2.secondarySchedules")}</Heading>
        <Weekdays schedules={secondarySchedules} />
      </div>
    </Wrapper>
  );
};

export default TimePreview;
