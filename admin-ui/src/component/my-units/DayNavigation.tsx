import React from "react";
import styled from "styled-components";
import { addDays, parse, subDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { Button, IconAngleLeft, IconAngleRight, DateInput } from "hds-react";
import { toUIDate } from "common/src/common/util";

type Props = {
  date: string;
  onDateChange: ({ date }: { date: Date }) => void;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-items: center;
  gap: 0;
  padding: 0 0.5em;
  color: black;
  text-decoration: none !important;
  svg {
    color: black;
  }
`;

const SimpleDatePicker = styled(DateInput)`
  border-color: transparent;

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
      <SimpleDatePicker
        disableConfirmation
        id="date-input"
        initialMonth={d}
        language="fi"
        required
        onChange={(value) =>
          onDateChange({ date: parse(value, "d.M.yyyy", new Date()) })
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
