import React, { ReactNode } from "react";
import styled from "styled-components";
import { IconCalendar, IconClock } from "hds-react";
import { useTranslation } from "react-i18next";
import { weekdays } from "../../common/const";
import { formatDate } from "../../common/util";
import { Divider } from "../../styles/util";

interface IProps {
  id: number;
  start: string;
  end: string;
  weekday: number;
  biweekly: boolean;
  timeStart: string;
  timeEnd: string;
}

const Wrapper = styled.tbody`
  line-height: var(--lineheight-xl);
`;

const Row = styled.tr``;

const Heading = styled(Row)`
  margin: 0;
`;

const Col = styled.td`
  white-space: nowrap;
  padding-right: var(--spacing-m);
`;

const Day = styled.div`
  display: inline-flex;
  border: 2px solid var(--color-black);
  padding: var(--spacing-3-xs) var(--spacing-s);
  margin-right: var(--spacing-s);
`;

interface IDateLabelProps {
  type: "date" | "time";
  children: ReactNode;
}

const LabelWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: 700;
  white-space: nowrap;
  position: relative;

  svg {
    margin-right: var(--spacing-xs);
    position: relative;
    top: -2px;
  }
`;

function Label({ type, children }: IDateLabelProps): JSX.Element {
  return (
    <Col>
      <LabelWrapper>
        {type === "date" ? <IconCalendar size="m" /> : <IconClock size="m" />}
        {children}
      </LabelWrapper>
    </Col>
  );
}

function RecommendedSlot({
  id,
  start,
  end,
  weekday,
  biweekly,
  timeStart,
  timeEnd,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  const formatTime = (input: string) => {
    const hm = input.split(":").slice(0, -1);
    return hm.join(":");
  };

  return (
    <Wrapper data-test-id={`recommendation__slot--${id}`}>
      <Heading>
        <Col colSpan={2}>{t("common.begins")}</Col>
        <Col>{t("common.ends")}</Col>
        <Col />
        <Col>{t("common.day")}</Col>
      </Heading>
      <Row>
        <Label type="date">{formatDate(start)}</Label>
        <Col>-</Col>
        <Label type="date">{formatDate(end)}</Label>
        <Col />
        <Col>
          <Day>{t(`calendar.${weekdays[weekday]}`).substring(0, 2)}</Day>
          <span>{t(`common.${biweekly ? "biweekly" : "weekly"}`)}</span>
        </Col>
      </Row>
      <Heading>
        <Col colSpan={3}>{t("common.timeOfDay")}</Col>
      </Heading>
      <Row>
        <Label type="time">{formatTime(timeStart)}</Label>
        <Col>-</Col>
        <Label type="time">{formatTime(timeEnd)}</Label>
      </Row>
      <Row>
        <Col colSpan={5}>
          <Divider />
        </Col>
      </Row>
    </Wrapper>
  );
}

export default RecommendedSlot;
