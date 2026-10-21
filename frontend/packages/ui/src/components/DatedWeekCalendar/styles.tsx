import styled from "styled-components";
import { unavailableBackgroundSVG } from "@ui/components/calendar/utils";
import { fontBold, fontMedium } from "@ui/styled";
import { visuallyHidden } from "../WeeklyPatternCalendar/styles";

export { LiveRegion, SkipLink } from "../WeeklyPatternCalendar/styles";

export const HiddenText = styled.span`
  ${visuallyHidden};
`;

export const DatedWeekRoot = styled.div`
  --border-color: var(--color-black-50);
  /* Also the minimum target size (WCAG 2.5.8) for a cell. */
  --step-height: 24px;
  --lane-gap: 2px;

  display: grid;
  gap: var(--spacing-xs);

  /* Stops the drag from also selecting the text of the cells the pointer crosses. */
  &[data-dragging] {
    user-select: none;
  }

  /* The pointer leaves the thin handle as soon as it moves, so the whole calendar keeps its cursor until release. */
  &[data-dragging="resize"] {
    cursor: ns-resize;
  }
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

    background: var(--color-white);
    ${fontBold};
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
    ${fontBold};
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

    &[data-hour-start]:not(:has([data-draft])) {
      border-top: 1px solid var(--border-color);
    }

    &[data-availability="closed"] {
      background-color: var(--color-black-5);
      background-image: ${unavailableBackgroundSVG};
      background-size: auto calc(var(--step-height) / 2);
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
  font-size: var(--fontsize-body-s);
  padding: 2px var(--spacing-3-xs, 2px) 0;
  border-inline: 2px dashed var(--color-bus);
  background: var(--color-bus-light, var(--color-black-10));
  color: var(--color-black-90);
  text-align: left;
  pointer-events: none;

  &[data-segment-start] {
    border-top-left-radius: var(--spacing-2-xs);
    border-top-right-radius: var(--spacing-2-xs);
    border-top: 1px dashed var(--color-bus);
    z-index: 2;
  }

  &[data-segment-end] {
    border-bottom: 1px dashed var(--color-bus);
    border-bottom-left-radius: var(--spacing-2-xs);
    border-bottom-right-radius: var(--spacing-2-xs);
  }

  /* Only the draft can be dragged. Every other event stays decorative and lets clicks fall through to its cell. */
  &[data-draft] {
    pointer-events: auto;
    cursor: grab;
    touch-action: none;
  }

  /* Grabbed, by a click, a drag or the keyboard, until the move is confirmed or cancelled. */
  &[data-moving] {
    ${fontMedium};
    cursor: grabbing;
    box-shadow:
      inset 3px 0 0 0 var(--color-bus),
      inset -3px 0 0 0 var(--color-bus);
    &[data-segment-start] {
      box-shadow:
        inset 3px 0 0 0 var(--color-bus),
        inset -3px 0 0 0 var(--color-bus),
        inset 0 3px 2px 0 var(--color-bus);
    }
    &[data-segment-end] {
      box-shadow:
        inset 3px 0 0 0 var(--color-bus),
        inset -3px 0 0 0 var(--color-bus),
        inset 0 -3px 2px 0 var(--color-bus);
    }
  }
  :has([data-moving]) {
    box-shadow:
      inset 3px 0 0 0 var(--focus-outline-color),
      inset -3px 0 0 0 var(--focus-outline-color);
  }

  ${DatedWeekRoot}[data-dragging="resize"] & {
    cursor: ns-resize;
  }
`;

// Resizes the draft from its foot, the way the Shorter and Longer buttons do. Its own pointerdown stops the
// drag from also being read as a move of the whole event.
export const ResizeHandle = styled.span`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 6px;
  border-bottom-left-radius: 7px;
  border-bottom-right-radius: 7px;
  background-color: var(--color-bus);
  opacity: 0;
  cursor: ns-resize;
  touch-action: none;

  /* Stays shown for the whole resize, not only while the pointer happens to be over it. */
  &:hover,
  ${DatedWeekRoot}[data-dragging="resize"] & {
    opacity: 1;
  }
`;

// The current time, drawn over the cells of its row. One is rendered per day column, so together they
// cross the whole grid. Only the leftmost carries the dot, which marks the start of the line.
export const NowLine = styled.span`
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-bus);
  pointer-events: none;
`;

export const NowDot = styled.span`
  position: absolute;
  top: 50%;
  left: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-bus);
  transform: translate(-50%, -50%);
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
