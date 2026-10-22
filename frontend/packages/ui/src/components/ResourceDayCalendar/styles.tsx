import styled from "styled-components";
import { NowIndicator } from "@ui/components/DatedWeekCalendar/styles";
import { fontMedium } from "@ui/styled";
import { gridTableStyles } from "../CalendarGrid/styles";

export { ListAlternative } from "../DatedWeekCalendar/styles";

export const ResourceDayRoot = styled.div`
  --border-color: var(--color-black-50);

  /* Row height. Also well above the minimum target size (WCAG 2.5.8) for a cell. */
  --step-height: 48px;
  --step-width: 40px;
  --time-column-width: 160px;
  --lane-gap: 2px;

  display: grid;
  gap: var(--spacing-xs);
`;

export const GridScroller = styled.div`
  position: relative;
  overflow: auto;
  max-width: 100%;
  max-height: 70vh;
  overscroll-behavior: contain;

  /* Keeps a focused cell out from under the sticky header and row header (WCAG 2.4.11). */
  scroll-padding-top: 3rem;
  scroll-padding-left: var(--time-column-width);
  ${gridTableStyles};

  table {
    min-width: calc(var(--time-column-width) + var(--steps) * var(--step-width));
  }

  thead td {
    left: 0;
    z-index: 4;
    border: none;
  }

  thead th {
    padding: var(--spacing-2-xs) var(--spacing-3-xs);
    text-align: left;
    font-size: var(--fontsize-body-s);
    border-left: 1px solid var(--border-color);
    z-index: 4;
  }

  tbody th {
    position: sticky;
    left: 0;
    z-index: 3;
    box-sizing: border-box;
    padding: var(--spacing-2-xs) var(--spacing-xs);
    border-top: 1px solid var(--border-color);
    border-left: 2px solid var(--border-color);
    border-right: 1px solid var(--border-color);
    background: var(--color-white);
    ${fontMedium};
    font-size: var(--fontsize-body-s);
    line-height: var(--lineheight-s);
    text-align: left;
    overflow: hidden;

    &[data-draft],
    *:nth-child > & {
      border-inline-start: 2px dashed var(--color-alert-dark);
    }
  }

  tbody td {
    padding: 0;
    border:
      1px solid var(--border-color),
      0,
      0;
    font-size: var(--fontsize-body-s);
    &[data-hour-start] {
      border-left: 1px solid var(--color-black-90);
    }
    &[data-availability="closed"] {
      background-size: auto 12px;
    }
  }

  tr:last-child th,
  tr:last-child td {
    border-bottom: 1px solid var(--border-color);
  }
`;

// One decorative stripe per event, drawn in the cell it begins in and as wide as the event is long.
// The cell's own label carries the meaning for screen readers.
export const EventStripe = styled.span`
  position: absolute;
  z-index: 1;
  top: calc(var(--lane) / var(--lanes) * 100% + var(--lane-gap));
  height: calc(100% / var(--lanes) - 2 * var(--lane-gap));
  box-sizing: border-box;
  overflow: hidden;
  padding: 2px var(--spacing-3-xs, 2px) 0;
  border: 1px dashed var(--color-bus);
  border-radius: var(--spacing-2-xs);
  background: var(--color-bus-light, var(--color-black-10));
  color: var(--color-black-90);
  font-size: 12px;
  line-height: 1.2;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;

  &[data-continues-before] {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left-style: none;
  }

  &[data-continues-after] {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right-style: none;
  }
`;

// The current time, drawn over the cell it falls in. One is rendered per resource row, so together
// they cross the grid. The dot is carried in the table head, which marks the (visible) top of the line.
export const NowLine = styled(NowIndicator)`
  top: 0;
  bottom: 0;
  width: 2px;
`;

export const NowDot = styled(NowIndicator)`
  bottom: 0;
  transform: translate(calc(-50% + 1px), 50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
`;

// Fixed, so the scroller's overflow can't clip it. Placed from the hovered cell's position.
export const EventTooltip = styled.div`
  position: fixed;
  z-index: 100;
  display: grid;
  gap: var(--spacing-xs);
  max-width: 300px;
  pointer-events: none;
`;
