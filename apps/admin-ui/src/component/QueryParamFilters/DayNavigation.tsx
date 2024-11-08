import React from "react";
import styled from "styled-components";
import { addDays, subDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { Button, IconAngleLeft, IconAngleRight, DateInput } from "hds-react";
import { fromUIDate, toUIDate } from "common/src/common/util";
import { breakpoints } from "common";
import { toMondayFirstUnsafe } from "common/src/helpers";
import { useSearchParams } from "react-router-dom";
import { Flex } from "common/styles/util";

const Wrapper = styled(Flex).attrs({
  $gap: "none",
  $direction: "row",
})`
  place-items: center;
  position: relative;
`;

/* hackish way to add date label inside the date selector
 * if position is not absolute it breaks the responsivity of the date selector
 */
const WeekDay = styled.span`
  position: absolute;
  left: 17%;
  bottom: 25%;
  z-index: 10;
`;

const BorderlessDatePicker = styled(DateInput)`
  --input-border-color-default: transparent;
  max-width: 180px;
  @media (min-width: ${breakpoints.m}) {
    margin-right: var(--spacing-s);
  }
  & input {
    text-align: center;
  }
`;

type Props = {
  name: string;
};

export function DayNavigation({ name }: Props): JSX.Element {
  if (name.length === 0) {
    throw new Error("name must not be empty");
  }

  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value.length > 0) {
      params.set(name, value);
      setSearchParams(params, { replace: true });
    } else {
      params.delete(name);
      setSearchParams(params, { replace: true });
    }
  };

  const uiDate = searchParams.get(name) ?? "";
  // fronUIDate returns null if the input is invalid
  const d = fromUIDate(uiDate) ?? new Date();

  const onPreviousDay = () => {
    handleChange(toUIDate(subDays(d, 1)));
  };
  const onNextDay = () => {
    handleChange(toUIDate(addDays(d, 1)));
  };

  // unsafe is fine here d is a valid date and getDay has only 6 possible values
  const day = toMondayFirstUnsafe(d.getDay());

  return (
    <Wrapper>
      <Button
        aria-label={t("common.prev")}
        size="small"
        variant="supplementary"
        theme="black"
        onClick={onPreviousDay}
        iconLeft={<IconAngleLeft />}
      >
        {" "}
      </Button>
      <WeekDay>{`${t(`dayShort.${day}`)} `}</WeekDay>
      <BorderlessDatePicker
        disableConfirmation
        id="date-input"
        initialMonth={d}
        language="fi"
        required
        onChange={(value) => handleChange(value)}
        value={uiDate}
      />
      <Button
        aria-label={t("common.next")}
        size="small"
        variant="supplementary"
        theme="black"
        onClick={onNextDay}
        iconLeft={<IconAngleRight />}
      >
        {" "}
      </Button>
    </Wrapper>
  );
}
