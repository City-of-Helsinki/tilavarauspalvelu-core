import React from "react";
import { IconAngleLeft, IconAngleRight } from "hds-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { fi } from "date-fns/locale/fi";
import styled from "styled-components";
import type { NavigateAction, View } from "react-big-calendar";
import { useTranslation } from "next-i18next";
import { Flex, NoWrap } from "../../styles/util";
import { fontMedium } from "../common/typography";
import { breakpoints } from "../common/style";

const DateNavigationWrapper = styled(Flex).attrs({
  $direction: "row",
  $alignItems: "center",
})`
  flex-grow: 1;
  > span {
    flex-grow: 1;
  }

  /* looks better as last on mobile
   * could also make it first but then it has to be greedy
   * so the buttons will always break to the next line  */
  order: 2;
  @media (min-width: ${breakpoints.s}) {
    order: unset;
  }
`;

const Label = styled(NoWrap)`
  display: inline-flex;
  justify-content: center;
  text-transform: capitalize;
  ${fontMedium}
  font-size: var(--fontsize-body-l);
`;

/* TODO rewrite this to use inheritable button styles (or HDS buttons) */
const Btn = styled.button<{
  $borderless?: boolean;
  $active?: boolean;
}>`
  /* rbc-toolbar button overrides these */
  && {
    border: 2px solid var(--color-black);
    border-radius: 0;
    cursor: pointer;
    user-select: none;
    ${fontMedium}
    color: var(--color-black);
    font-size: var(--fontsize-body-m);
    height: 44px;

    ${(props) =>
      props.$borderless &&
      `
      border: none;
      color: var(--color-gray-dark);
    `}

    ${(props) =>
      props.$active &&
      `
      cursor: default;
      background-color: var(--color-bus);
      color: var(--color-white);
      border-color: var(--color-bus);
    `}

    &[disabled] {
      cursor: not-allowed;
      border-color: var(--color-black-30);
      color: var(--color-black-30);
    }
  }
`;

type ToolbarProps = {
  onNavigate: (n: NavigateAction) => void;
  onView: (n: View) => void;
  view: string;
  date: Date;
};

export function Toolbar({ onNavigate, onView, view, date }: ToolbarProps) {
  const culture = { locale: fi };
  const { t } = useTranslation();

  let title = "";
  switch (view) {
    case "day": {
      const year = format(date, "yyyy", culture);
      const currentYear = format(new Date(), "yyyy");
      const dateStr = currentYear !== year ? "EEEEEE d.M yyyy" : "EEEEEE d.M";

      title = format(date, dateStr, culture);
      break;
    }
    case "week":
    default: {
      const start = startOfWeek(date, culture);
      const end = endOfWeek(date, culture);
      const startDay = format(start, "d", culture);
      const endDay = format(end, "d", culture);
      const startMonth = format(start, "M", culture);
      const endMonth = format(end, "M", culture);
      const startYear = format(start, "yyyy", culture);
      const endYear = format(end, "yyyy", culture);
      const currentYear = format(new Date(), "yyyy", culture);
      title = `${startDay}.${startMonth !== endMonth ? `${startMonth}.` : ""}${
        startYear !== endYear ? startYear : ""
      } – ${endDay}.${endMonth}.${
        startYear !== endYear || endYear !== currentYear ? endYear : ""
      }`;
    }
  }

  return (
    <Flex
      $direction="row"
      $gap="xs"
      $justifyContent="space-between"
      $alignItems="center"
      $wrap="wrap"
      className="rbc-toolbar"
    >
      <div>
        <Btn
          type="button"
          onClick={() => onNavigate("TODAY")}
          aria-label={t("reservationCalendar:showCurrentDay")}
        >
          {t("common:today")}
        </Btn>
      </div>
      <DateNavigationWrapper>
        <Btn
          $borderless
          type="button"
          onClick={() => onNavigate("PREV")}
          aria-label={t("reservationCalendar:showPrevious", {
            view: t(`common:${view}`).toLowerCase(),
          })}
        >
          <IconAngleLeft />
        </Btn>
        <Label>{title}</Label>
        <Btn
          $borderless
          type="button"
          onClick={() => onNavigate("NEXT")}
          aria-label={t("reservationCalendar:showNext", {
            view: t(`common:${view}`).toLowerCase(),
          })}
        >
          <IconAngleRight />
        </Btn>
      </DateNavigationWrapper>
      <div>
        <Btn
          $active={view === "day"}
          type="button"
          onClick={() => onView("day")}
          aria-label={t("reservationCalendar:showView", {
            view: t("common:day").toLowerCase(),
          })}
        >
          {t("common:day")}
        </Btn>
        <Btn
          $active={view === "week"}
          type="button"
          onClick={() => onView("week")}
          aria-label={t("reservationCalendar:showView", {
            view: t("common:week").toLowerCase(),
          })}
        >
          {t("common:week")}
        </Btn>
      </div>
    </Flex>
  );
}
