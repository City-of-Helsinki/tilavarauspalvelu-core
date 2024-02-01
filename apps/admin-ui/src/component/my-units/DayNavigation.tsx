import React from "react";
import styled from "styled-components";
import { addDays, subDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { Button, IconAngleLeft, IconAngleRight, DateInput } from "hds-react";
import { fromUIDate, toUIDate } from "common/src/common/util";
import { breakpoints } from "common";

type Props = {
  date: string;
  onDateChange: ({ date }: { date: Date }) => void;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  place-items: center;
  gap: 0;
  padding: 0 0.5em;
  color: black;
  text-decoration: none !important;
  svg {
    color: black;
  }
`;

const WeekDay = styled.span`
  @media (min-width: ${breakpoints.m}) {
    margin-left: var(--spacing-s);
  }
`;

const SimpleDatePicker = styled(DateInput)`
  border-color: transparent;
  max-width: 180px;
  @media (min-width: ${breakpoints.m}) {
    margin-right: var(--spacing-s);
  }
  & input {
    text-align: center;
    border-color: transparent !important;
  }

  & *[class*="hds-text-input__buttons"] > button {
    padding: 0 !important;
  }
`;

const DayNavigation = ({ date, onDateChange }: Props): JSX.Element => {
  const d = new Date(date);
  const { t } = useTranslation();

  const onPreviousDay = () => onDateChange({ date: subDays(d, 1) });
  const onNextDay = () => onDateChange({ date: addDays(d, 1) });

  return (
    <Wrapper>
      <Button
        aria-label={t("common.prev")}
        size="small"
        variant="supplementary"
        onClick={onPreviousDay}
        iconLeft={<IconAngleLeft />}
      >
        {" "}
      </Button>
      <WeekDay>{`${t(`dayShort.${d.getDay()}`)} `}</WeekDay>
      <SimpleDatePicker
        disableConfirmation
        id="date-input"
        initialMonth={d}
        language="fi"
        required
        onChange={(value) =>
          onDateChange({ date: fromUIDate(value) ?? new Date() })
        }
        value={toUIDate(d)}
      />
      <Button
        aria-label={t("common.next")}
        size="small"
        variant="supplementary"
        onClick={onNextDay}
        iconLeft={<IconAngleRight />}
      >
        {" "}
      </Button>
    </Wrapper>
  );
};

export default DayNavigation;
