import styled from "styled-components";
import { unavailableBackgroundSVG } from "@ui/components/calendar/utils";
import { fontMedium } from "@ui/styled";

export { SkipLink } from "../WeeklyPatternCalendar/styles";

export const DatedWeekRoot = styled.div`
  --border-color: var(--color-black-50);
  /* Also the minimum target size (WCAG 2.5.8) for a cell. */
  --step-height: 24px;
  --lane-gap: 2px;

  display: grid;
  gap: var(--spacing-xs);
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-xs);
`;

export const ToolbarGroup = styled.div`
  display: flex;
  gap: var(--spacing-2-xs);
`;

export const RangeTitle = styled.p`
  ${fontMedium};
  flex: 1 1 12rem;
  margin: 0;
  text-align: center;
`;

export const ToolbarButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  padding: 0 var(--spacing-s);
  border: 2px solid var(--color-black-90);
  background: var(--color-white);
  color: var(--color-black-90);
  font: inherit;
  cursor: pointer;

  &[aria-pressed="true"] {
    background: var(--color-black-90);
    color: var(--color-white);
  }

  &:focus-visible {
    outline: 3px solid var(--color-focus-outline);
    outline-offset: 2px;
  }
`;

export const GridScroller = styled.div`
  position: relative;
  overflow: auto;
  max-height: 70vh;
  /* Keeps a focused cell out from under the sticky header (WCAG 2.4.11). */
  scroll-padding-top: 3rem;

  table {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    width: 100%;
    min-width: calc(56px + var(--days) * 110px);
  }

  colgroup col:first-child {
    width: 56px;
  }

  thead th,
  thead td {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: var(--spacing-2-xs) var(--spacing-xs);
    border-bottom: 1px solid var(--border-color);
    background: var(--color-white);
    ${fontMedium};
    text-align: center;
  }

  thead td {
    border: none;
  }

  thead th[aria-current="date"] {
    background: var(--color-black-5);
    box-shadow: inset 0 -4px 0 var(--color-black-90);
  }

  tbody th {
    padding: 0 var(--spacing-xs);
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
  }

  tbody td {
    position: relative;
    box-sizing: border-box;
    height: var(--step-height);
    padding: 0;
    border-inline: 1px solid var(--border-color);
    background: var(--color-white);
    font-size: var(--fontsize-body-s);
    line-height: 1.1;

    &[data-hour-start] {
      border-top: 1px solid var(--border-color);
    }

    &[data-availability="closed"] {
      background-color: var(--color-black-5);
      background-image: ${unavailableBackgroundSVG};
      background-size: auto var(--step-height);
    }

    &:focus-visible {
      z-index: 1;
      outline: 3px solid var(--color-focus-outline);
      outline-offset: -3px;
    }
  }

  tr:last-child td {
    border-bottom: 1px solid var(--border-color);
  }
`;

// One decorative stripe per event in a cell. The cell's own label carries the meaning for screen readers.
export const EventStripe = styled.span`
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--lane) / var(--lanes) * 100% + var(--lane-gap));
  width: calc(100% / var(--lanes) - 2 * var(--lane-gap));
  box-sizing: border-box;
  overflow: hidden;
  padding: 2px var(--spacing-3-xs, 2px) 0;
  border-inline: 2px solid var(--color-black-90);
  background: var(--color-bus-light, var(--color-black-10));
  color: var(--color-black-90);
  text-align: left;
  pointer-events: none;

  &[data-segment-start] {
    border-top: 2px solid var(--color-black-90);
    border-top-left-radius: var(--spacing-2-xs);
    border-top-right-radius: var(--spacing-2-xs);
  }

  &[data-segment-end] {
    border-bottom: 2px solid var(--color-black-90);
    border-bottom-left-radius: var(--spacing-2-xs);
    border-bottom-right-radius: var(--spacing-2-xs);
  }
`;

export const ListAlternative = styled.details`
  summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  ul {
    margin: 0;
    padding-left: var(--spacing-m);
  }
`;
