import React from "react";
import styled, { css } from "styled-components";
import { unavailableBackgroundSVG } from "@ui/components/calendar/utils";
import { fontBold } from "@ui/styled";
import { gridTableStyles } from "../CalendarGrid/styles";
import type { CellAppearance } from "./types";

/**
 * `invalid` are runs that getRunError rejects, drawn as in the calendar: primary in 75% opaque error red
 * with a white arrow, secondary in 30% opaque error red with an error red outline and a black arrow. Both are shown
 * with a split legend swatch, so the user can see that the run is invalid but still distinguish its priority by shape.
 */
export type LegendState = CellAppearance | "open" | "closed" | "unavailable" | "invalid";
export type LegendItem = { state: LegendState; label: string; current?: boolean };

export const arrow = css`
  content: "";
  position: absolute;
  z-index: 1;
  left: 8px;
  top: 3px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
`;

// The fill (background and text colour) applies to every cell of a run. The arrow indicator
// is split out separately so it can be restricted to just the first cell of a run.
export const primaryFill = css`
  background: var(--color-bus);
  color: var(--color-white);
`;

export const secondaryFill = css`
  background: var(--color-engel);
  color: var(--color-black);
`;

// Primary and secondary differ by shape as well as colour, so they stay distinguishable without colour.
export const primaryIndicator = css`
  &::after {
    ${arrow};
    border-bottom: 8px solid var(--color-white);
  }
`;

export const secondaryIndicator = css`
  &::after {
    ${arrow};
    border-top: 8px solid var(--color-black);
  }
`;

// Full fragment (fill + indicator), for contexts like the legend swatch where there's
// no "run" to speak of and the arrow should always be shown.
const primaryFragment = css`
  ${primaryFill};
  ${primaryIndicator};
`;

const secondaryFragment = css`
  ${secondaryFill};
  ${secondaryIndicator};
`;

// The cell stays in the table's flow (the shared styles make it `position: relative`, the box `::before` fills).
// An absolute cell would leave its row, and the cells after it would slide one column to the left.
const eventBackground = (appearance: CellAppearance) => css`
  background: transparent;
  padding-right: 4px;
  &::before {
    display: block;
    content: "";
    position: absolute;
    z-index: 1;
    inset: 0 var(--event-gap) -2px; /* The event should be drawn on top of eventual cell bottom-border. */
    padding-inline: 4px;
    ${appearance === "secondary" && "border-inline: 1px solid var(--border-color)"};
    font-size: var(--fontsize-body-s);
    text-align: right;
    color: ${appearance === "primary" ? "var(--color-white)" : "var(--color-black)"};
    background-color: ${appearance === "primary" ? "var(--color-bus)" : "var(--color-engel)"};
  }

  &[data-run-start] {
    z-index: 2;

    /* The run's time label, laid over the box ::before draws, in the same place the box's own text used to be. */
    & > [data-run-time] {
      position: absolute;
      z-index: 2;
      inset: 0 var(--event-gap) auto;
      padding-top: 2px;
      padding-inline: 4px;
      ${appearance === "secondary" && "border-inline: 1px solid transparent"};
      font-size: var(--fontsize-body-s);
      text-align: right;
      color: ${appearance === "primary" ? "var(--color-white)" : "var(--color-black)"};
      pointer-events: none;
    }
    &[data-run-end] {
      & > [data-run-time] {
        padding-top: 0;
        margin-top: -1px /* Make the time text fit inside the box */;
      }
      &::after {
        top: 1px;
      }
    }
  }

  /*
    Only the ends of a block are rounded. Where runs of different data touch, they join square and without a gap, so
    the time reads as one: the earlier run's box keeps reaching over the cell border (the -2px above), and the later
    run's box covers its own top border, which its z-index would otherwise draw over the earlier box.
  */
  &[data-block-start]::before {
    border-top-left-radius: var(--event-border-radius);
    border-top-right-radius: var(--event-border-radius);
  }

  &[data-run-start]:not([data-block-start])::before {
    top: -1px;
  }

  &[data-block-end]::before {
    bottom: 0;
    border-bottom-left-radius: var(--event-border-radius);
    border-bottom-right-radius: var(--event-border-radius);
  }
`;

/**
 * The grid's own box. A view that needs another size, or another colour, sets one of these custom properties on
 * an ancestor, or through the calendar's `style` prop:
 *
 * - `--weekly-pattern-height`, the height of the box. `auto` drops the inner vertical scroll and lets the page
 *   carry the whole grid.
 * - `--weekly-pattern-day-min-width`, how narrow a weekday column may get before the box scrolls sideways.
 * - `--weekly-pattern-step-height`, the height of one row.
 * - `--weekly-pattern-width`, the width of the table. `0` shrinks it to the day column minimums instead of filling the box.
 * - `--weekly-pattern-selection-color`, the colour of the frame around the Selection in select mode.
 *
 * The defaults suit the application funnel and the staff application view, which pass nothing.
 */
export const WeeklyPatternRoot = styled.div`
  --border-color: var(--color-black-50);
  --selection-color: var(--weekly-pattern-selection-color, var(--color-black-80));
  ${gridTableStyles};

  position: relative;

  /*
    The root is not a scroll container itself (the scroller inside it is), so as a grid or flex item it would grow to
    the table's min-width and widen the whole page on phones. min-width: 0 lets it shrink and the scroller scroll.
  */
  min-width: 0;

  /*
    The shared table has fixed layout and an explicit colgroup, which keeps every weekday column the same width.
    Keeps every day column at least as wide as the original per-cell min-width.
    The container's overflow-x: auto scrolls instead of squeezing columns too thin.
  */
  table {
    /* Fills the box by default. A view that sets --weekly-pattern-width to 0 gets a table just as wide as its minimum. */
    width: var(--weekly-pattern-width, 100%);
    min-width: calc(var(--time-column-width) + 7 * var(--weekly-pattern-day-min-width, 110px));
    user-select: none;
    -webkit-touch-callout: none; /* No iOS callout on the long press that starts touch painting. */
    touch-action: manipulation;

    /* The shared table styles read --step-height, so the override arrives through it. */
    --step-height: var(--weekly-pattern-step-height, 12px);
    --time-column-width: 30px; /* Just wide enough for a time label like "14". The other columns split the rest evenly. */
    --event-gap: 4px;
    --event-border-radius: 4px;
  }

  thead th,
  thead td {
    font-size: var(--fontsize-body-m);
    border-bottom: 1px solid var(--border-color);
    z-index: 3;
  }

  /* The empty corner above the time labels sticks to both edges, so the weekday headers slide under it. */
  thead td {
    left: 0;
    z-index: 4;
    border: none;
    padding: 0;
  }

  tbody th {
    ${fontBold};
    font-size: var(--fontsize-body-m);
    text-align: center;
    vertical-align: top;
    white-space: nowrap;
    z-index: 3;
    border-top: 1px solid var(--color-black-20);
  }

  tbody td {
    padding: 0 var(--spacing-2-xs) 0 0;
    width: calc((100% - var(--time-column-width)) / 7);
    cursor: pointer;
    text-align: center;
    font-size: 12px;
    line-height: 0.9;
    color: transparent;
    transition:
      color 0.1s ease-in-out,
      background 0.1s ease-in-out,
      box-shadow 0.1s ease-in-out;
    border-top: 1px solid var(--color-black-10);

    &[data-hour-start] {
      border-top: 1px solid var(--border-color);
    }

    &[data-appearance="primary"] {
      ${eventBackground("primary")};
    }

    &[data-appearance="secondary"] {
      ${eventBackground("secondary")};
      border-inline: 1px solid var(--border-color);

      /* The outline closes only at the block's ends. Next to a primary run, the change of colour shows the seam. */
      &[data-block-start]::before {
        box-shadow: inset 0 1px 0 var(--color-black-50);
      }

      &[data-block-end]::before {
        box-shadow: inset 0 -1px 0 var(--color-black-50);
      }

      &[data-block-start][data-block-end]::before {
        box-shadow:
          inset 0 1px 0 var(--color-black-50),
          inset 0 -1px 0 var(--color-black-50);
      }
    }

    &[aria-disabled="true"] {
      cursor: default;
    }

    &[data-availability="closed"] {
      /* A run can be painted on closed cells, as long as at least one space has the time reservable. Then the
         hatch-pattern shows through it. So a run can be placed on closed cells, but not on unavailable ones. */
      &[data-appearance="primary"],
      &[data-appearance="secondary"] {
        cursor: pointer;
        background-image: ${unavailableBackgroundSVG};
        background-size: auto calc(var(--step-height) / 2);
      }

      /* Due to the opacity being lower, a darker background can be used. It also makes a clearer distinction between
         the parts of the run which are on closed cells. */
      &[data-appearance="primary"]::before {
        background-color: rgb(from var(--color-bus-dark) r g b / 0.6);
      }

      &[data-appearance="secondary"]::before {
        background-color: rgb(from var(--color-engel-dark) r g b / 0.75);
      }
    }

    /* None of the reservation units can be booked here, so nothing can be painted either. */
    &[data-availability="unavailable"] {
      border-top-color: rgb(from var(--color-black) r g b / 0.1);
      background: var(--color-black-30);
      &[data-hour-start] {
        border-top-color: rgb(from var(--color-black) r g b / 0.5);
      }
    }

    /* The arrow only marks where a run begins, not every cell in it. */
    &[data-appearance="primary"][data-run-start] {
      ${primaryIndicator};
    }

    &[data-appearance="secondary"][data-run-start] {
      ${secondaryIndicator};
    }

    /*
      A run that getRunError rejects (data-invalid), e.g. one shorter than a minimum duration.
      It is drawn in error red with white text (about 7:1), whatever its priority. The priority arrow stays, so the run
      still shows its priority by shape, but turns white like the text.
      The selectors repeat [data-appearance] and [data-run-start] to outweigh the appearance, closed and arrow rules.
    */
    &[data-invalid][data-appearance]::before {
      background-color: var(--color-error);
      border-color: var(--color-error);
      box-shadow: none;
    }
    &[data-invalid][data-appearance][data-run-start] {
      /* The arrow is a border triangle: primary draws the bottom border, secondary the top. Only the drawn one shows. */
      &::after {
        border-top-color: var(--color-white);
        border-bottom-color: var(--color-white);
      }
      & > [data-run-time] {
        color: var(--color-white);
      }
    }

    /*
      An invalid secondary run is drawn light, so it differs from an invalid primary one by colour too: a light error
      fill with black text and arrow, outlined in error red where a valid secondary run has its dark outline (the sides,
      and the top and bottom at the block's ends). Placed after the rules above, so it wins at equal specificity.
    */
    &[data-invalid][data-appearance="secondary"] {
      &::before {
        background-color: var(--color-error-light);
        border-color: var(--color-error);
      }
      &[data-block-start]::before {
        box-shadow: inset 0 1px 0 var(--color-error);
      }
      &[data-block-end]::before {
        box-shadow: inset 0 -1px 0 var(--color-error);
      }
      &[data-block-start][data-block-end]::before {
        box-shadow:
          inset 0 1px 0 var(--color-error),
          inset 0 -1px 0 var(--color-error);
      }
      &[data-run-start] {
        &::after {
          border-top-color: var(--color-black);
        }
        & > [data-run-time] {
          color: var(--color-black);
        }
      }
    }
  }

  /*
    Select mode. The Selection is one run of cells on one weekday, so it is drawn as one frame around the run:
    both sides on every cell, the top on the first and the bottom on the last. A view that wants a tint as well
    styles these same attributes. The frame is a box shadow, so it takes no space and leaves the focus outline,
    which is an outline, to show on top of it.
  */
  table[data-select] tbody td[data-selected] {
    --selection-top: 0;
    --selection-bottom: 0;

    box-shadow:
      inset 3px 0 0 0 var(--selection-color),
      inset -3px 0 0 0 var(--selection-color),
      inset 0 var(--selection-top) 0 0 var(--selection-color),
      inset 0 calc(-1 * var(--selection-bottom)) 0 0 var(--selection-color);

    &[data-selection-start] {
      --selection-top: 3px;
    }

    &[data-selection-end] {
      --selection-bottom: 3px;
    }
  }

  [data-readonly] td,
  [data-disabled] td {
    cursor: default;
  }

  tr:last-child td {
    border-bottom: 1px solid var(--border-color);
  }

  table:not([aria-readonly]) tbody td[data-availability="open"]:not([data-appearance]):hover {
    color: var(--color-black-30);
    background: var(--color-black-5);
  }
`;

/*
  A sticky element sticks inside its nearest scroll container. The grid scrolls sideways (overflow-x: auto), which makes
  it a scroll container in both directions, so a sticky <thead> inside it could never stick to the page. The weekday
  header is therefore drawn twice: this copy sits outside the scroll area and sticks to the top of the page, and the
  grid's own <thead> stays in the table for assistive technology, visually hidden. The copy follows the grid's
  horizontal scroll position (set in JS), and both tables share the same fixed layout, so their columns line up.
*/
export const WeeklyPatternStickyHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  overflow: hidden;
  scrollbar-gutter: stable;
`;

export const WeeklyPatternScroller = styled.div`
  overflow-x: auto;
  height: var(--weekly-pattern-height, auto);
  scrollbar-gutter: stable;

  /* The visible header is the sticky copy. This one stays for screen readers but takes no space. */
  && thead th,
  && thead td {
    height: 0;
    padding: 0;
    border: 0;
  }
`;

/* Placed by RunErrorTooltip with a transform, so it starts at the window's top-left corner. */
export const WeeklyPatternTooltip = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--tilavaraus-stack-popup-menu);
  max-width: min(260px, calc(100vw - 12px));
  padding: var(--spacing-2-xs) var(--spacing-xs);
  border-radius: 4px;
  background: var(--color-black-90);
  color: var(--color-white);
  font-size: var(--fontsize-body-s);
  line-height: var(--lineheight-m);
  box-shadow: 0 2px 6px rgb(0 0 0 / 0.25);
`;

/* The legend has to wrap. Long labels on one line set the page's minimum width, which zooms out the page on phones. */
const LegendList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin: 0;
  padding: 0;
  list-style: none;
`;

const LegendItemRow = styled.li`
  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);
  &[aria-current="true"] {
    font-family: var(--font-bold), sans-serif;
  }
`;

const LegendBox = styled.div<{ $state: LegendState }>`
  position: relative;
  flex: none; /* Keep the swatch square when the label next to it wraps. */
  box-sizing: border-box;
  width: 30px;
  height: 30px;
  border: 1px solid var(--color-black-50);

  --primary-error: var(--color-error);
  --secondary-error: var(--color-error-light);
  background-color: ${({ $state }) =>
    $state === "unavailable"
      ? "var(--color-black-30)"
      : $state === "closed"
        ? "var(--color-black-5)"
        : "var(--color-white)"};
  ${({ $state }) => ($state === "primary" ? primaryFragment : $state === "secondary" ? secondaryFragment : "")}
  ${({ $state }) => $state === "closed" && `background-color: var(--color-black-10); background-image: ${unavailableBackgroundSVG}; background-size: auto 10px; background-repeat: repeat;`}
  ${({ $state }) =>
    $state === "invalid" &&
    `width: 45px;
    background: linear-gradient(105deg, rgb(from var(--color-error) r g b / .7) 0 50%, rgb(from var(--color-error) r g b / .3) 50% 100%);
    &:before {
      content: "";
      position: absolute;
      z-index: 1;
      left: 4px;
      top: 3px;
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 8px solid var(--color-white);
    }
    &:after {
      content: "";
      position: absolute;
      z-index: 1;
      left: auto;
      right: 4px;
      top: 3px;
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-bottom: 8px solid var(--color-black);
      border-top: none;
    }`}
  [aria-current="true"] > & {
    box-shadow: 0 0 0 2px var(--color-focus-outline);
  }
`;

export function WeeklyPatternLegend({ items }: { items: ReadonlyArray<LegendItem> }): React.ReactElement {
  return (
    <LegendList data-testid="weekly-pattern__legend">
      {items.map(({ state, label, current }) => (
        <LegendItemRow key={state} aria-current={current ? "true" : undefined}>
          <LegendBox $state={state} aria-hidden="true" />
          <span>{label}</span>
        </LegendItemRow>
      ))}
    </LegendList>
  );
}
