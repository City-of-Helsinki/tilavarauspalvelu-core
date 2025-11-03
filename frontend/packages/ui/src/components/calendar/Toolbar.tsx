import React from "react";
import type { NavigateAction, View } from "react-big-calendar";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { fi } from "date-fns/locale/fi";
import { IconAngleLeft, IconAngleRight, IconCalendarRecurring } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "@ui/modules/const";
import { Flex, fontMedium, NoWrap } from "@ui/styled";

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
  ${fontMedium};
  font-size: var(--fontsize-body-l);
`;

/* TODO rewrite this to use inheritable button styles (or HDS buttons) */
export const ToolbarBtn = styled.button.attrs({ type: "button" })<{
  $borderless?: boolean;
  $active?: boolean;
}>`
  /* rbc-toolbar button overrides these */

  && {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2-xs);
    border: 2px solid var(--color-black);
    border-radius: 0;
    cursor: pointer;
    user-select: none;
    color: var(--color-black);
    font-size: var(--fontsize-body-m);
    height: 44px;

    ${fontMedium}
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
  children?: React.ReactNode;
};

export function Toolbar({ onNavigate, onView, view, date, children }: Readonly<ToolbarProps>) {
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
      } – ${endDay}.${endMonth}.${startYear !== endYear || endYear !== currentYear ? endYear : ""}`;
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
      aria-hidden="true"
    >
      <Flex $direction="row">
        <ToolbarBtn onClick={() => onNavigate("TODAY")}>
          <IconCalendarRecurring />
          {t("common:today")}
        </ToolbarBtn>
        {children}
      </Flex>
      <DateNavigationWrapper>
        <ToolbarBtn $borderless onClick={() => onNavigate("PREV")}>
          <IconAngleLeft />
        </ToolbarBtn>
        <Label>{title}</Label>
        <ToolbarBtn $borderless onClick={() => onNavigate("NEXT")}>
          <IconAngleRight />
        </ToolbarBtn>
      </DateNavigationWrapper>
      <div>
        <ToolbarBtn $active={view === "day"} onClick={() => onView("day")}>
          {t("common:day")}
        </ToolbarBtn>
        <ToolbarBtn $active={view === "week"} onClick={() => onView("week")}>
          {t("common:week")}
        </ToolbarBtn>
      </div>
    </Flex>
  );
}
