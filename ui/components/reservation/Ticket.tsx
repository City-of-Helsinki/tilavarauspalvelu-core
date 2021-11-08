import React from "react";
import { differenceInMinutes, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { IconCalendar } from "hds-react";
import { isFinite } from "lodash";
import { H1, H2, fontMedium, Strongish } from "../../modules/style/typography";
import { capitalize, formatDurationMinutes } from "../../modules/util";

export type TicketState = "incomplete" | "complete";

type Props = {
  state: TicketState;
  title: string;
  subtitle?: string;
  begin?: string;
  end?: string;
  isFree?: boolean;
  bgColor?: string;
};

const PunchHole = styled.div<{ $bgColor: string }>`
  &:last-of-type {
    top: auto;
    bottom: -30px;
  }

  position: absolute;
  width: 22px;
  height: 40px;
  top: -30px;
  right: -10px;
  border-radius: 50%;
  z-index: 1;
  background-color: ${({ $bgColor }) => $bgColor};
`;

const Wrapper = styled.div<{ $state: TicketState }>`
  &:after {
    content: "";
    width: 60px;
    height: 100%;
    position: absolute;
    top: 0;
    right: -60px;
    background-color: inherit;
    border-left: 2px dashed var(--color-white);
    border-radius: 0 10px 10px 0;
  }

  ${({ $state }) => {
    switch ($state) {
      case "complete":
        return "background-color: #e1f5f3";
      case "incomplete":
      default:
        return "background-color: #e5f3fd";
    }
  }};
  box-sizing: border-box;
  border-radius: 10px 0 0 10px;
  padding: var(--spacing-m) var(--spacing-m);
  position: relative;
  width: calc(100% - 60px);
`;

const Content = styled.div``;

const Title = styled(H1)`
  margin: 0 0 var(--spacing-s) 0;
`;

const Subtitle = styled(H2)`
  margin: 0 0 var(--spacing-m) 0;
  font-size: 22px;
`;

const Duration = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
  ${fontMedium}
`;

const Price = styled.div<{ $isFree: boolean }>`
  margin-top: ${({ $isFree }) =>
    $isFree ? "var(--spacing-layout-xl)" : "var(--spacing-3-xl)"};
  margin-bottom: var(--spacing-s);
`;

const Ticket = ({
  state,
  title,
  subtitle,
  begin,
  end,
  isFree,
  bgColor = "var(--color-white)",
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const beginDate = t("common:dateWithWeekday", {
    date: begin && parseISO(begin),
  });

  const beginTime = t("common:timeWithPrefix", {
    date: begin && parseISO(begin),
  });

  const endDate = t("common:dateWithWeekday", {
    date: end && parseISO(end),
  });

  const endTime = t("common:time", {
    date: end && parseISO(end),
  });

  const duration = differenceInMinutes(new Date(end), new Date(begin));
  const timeString = `${beginDate} ${beginTime} - ${
    endDate !== beginDate ? endDate : ""
  }${endTime} (${t("common:duration", {
    duration: formatDurationMinutes(duration),
  })})`;

  return (
    <Wrapper $state={state}>
      <PunchHole $bgColor={bgColor} />
      <Content>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
        {isFinite(duration) && (
          <Duration data-test="reservation__time-range">
            <IconCalendar /> {capitalize(timeString)}
          </Duration>
        )}
        <Price $isFree={isFree}>
          {isFree && <Strongish>{t("reservationUnit:priceFree")}</Strongish>}
        </Price>
      </Content>
      <PunchHole $bgColor={bgColor} />
    </Wrapper>
  );
};

export default Ticket;
