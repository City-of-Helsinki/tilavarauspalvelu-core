import { endOfISOWeek, getISOWeek, startOfISOWeek } from "date-fns";
import { Button, IconAngleLeft, IconAngleRight } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { DATE_FORMAT_SHORT, formatDate } from "../../common/util";
import { HorisontalFlex } from "../../styles/layout";

type Props = {
  date: string;
  onNext: () => void;
  onPrev: () => void;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 1em 0.5em;
  color: black;
  text-decoration: none !important;
`;

const WeekNavigation = ({ date, onNext, onPrev }: Props): JSX.Element => {
  const d = new Date(date);
  const { t } = useTranslation();

  const week = getISOWeek(d);

  return (
    <Wrapper>
      <HorisontalFlex style={{ alignItems: "center", justifyItems: "center" }}>
        <Button
          aria-label={t("common.prev")}
          size="small"
          variant="supplementary"
          onClick={onPrev}
          iconLeft={<IconAngleLeft />}
        >
          {" "}
        </Button>
        <div style={{ minWidth: "10em", textAlign: "center" }}>
          {t("common.week")} {week} /{" "}
          {formatDate(startOfISOWeek(d).toISOString(), DATE_FORMAT_SHORT)} -{" "}
          {formatDate(endOfISOWeek(d).toISOString())}
        </div>
        <Button
          aria-label={t("common.next")}
          size="small"
          onClick={onNext}
          variant="supplementary"
          iconLeft={<IconAngleRight />}
        >
          {" "}
        </Button>
      </HorisontalFlex>
    </Wrapper>
  );
};

export default WeekNavigation;
