import React from "react";
import styled, { css } from "styled-components";
import { unavailableBackgroundSVG } from "@ui/components/calendar/utils";
import { fontMedium } from "@ui/styled";
import type { CellAppearance } from "./types";

export type LegendState = CellAppearance | "open" | "closed";
export type LegendItem = { state: LegendState; label: string; current?: boolean };

export const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

const arrow = css`
  content: "";
  position: absolute;
  left: 8px;
  top: 5px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
`;

// The fill (background and text colour) applies to every cell of a run. The arrow indicator
// is split out separately so it can be restricted to just the first cell of a run.
const primaryFill = css`
  background: var(--color-bus);
  color: var(--color-white);
`;

const secondaryFill = css`
  background: var(--color-engel);
  color: var(--color-black);
`;

// Primary and secondary differ by shape as well as colour, so they stay distinguishable without colour.
const primaryIndicator = css`
  &::after {
    ${arrow};
    border-bottom: 8px solid var(--color-white);
  }
`;

const secondaryIndicator = css`
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

const eventBackground = (appearance: CellAppearance) => css`
  position: absolute;
  background: transparent;
  padding-right: 4px;
  &::before {
    display: block;
    content: "";
    position: absolute;
    inset: 0 var(--event-gap);
    width: calc(100% - 18px);
    padding: 2px 4px 0;
    border-inline: 1px solid ${appearance === "primary" ? "transparent" : "var(--border-color)"};
    color: ${appearance === "primary" ? "var(--color-white)" : "var(--color-black)"};
    background-color: ${appearance === "primary" ? "var(--color-bus)" : "var(--color-engel)"};
  }

  &[data-run-start] {
    background: var(--color-white);
    ${primaryIndicator};

    &::before {
      top: 1px;
      padding-top: 2px;
      content: attr(data-runtime-start) "–" attr(data-runtime-end);
      border-top-left-radius: var(--spacing-2-xs);
      border-top-right-radius: var(--spacing-2-xs);
    }
  }

  &[data-run-end] {
    background: var(--color-white);
    &::before {
      bottom: 0;
      border-bottom-left-radius: var(--spacing-2-xs);
      border-bottom-right-radius: var(--spacing-2-xs);
    }
  }
`;

export const SkipLink = styled.a`
  ${visuallyHidden};

  &:focus {
    position: static;
    width: auto;
    height: auto;
    margin: 0 0 var(--spacing-xs);
    overflow: visible;
    clip-path: none;
    white-space: normal;
  }
`;

export const LiveRegion = styled.div`
  ${visuallyHidden};
`;

export const WeeklyPatternRoot = styled.div`
  --border-color: var(--color-black-50);

  position: relative;
  overflow-x: auto;
  height: 500px;
  table {
    border-collapse: separate;
    border-spacing: 0;

    /* fixed layout + an explicit colgroup keeps every weekday column the same width,
       regardless of how long its header text is or how row spans fall in the time gutter. */
    table-layout: fixed;
    width: 100%;

    /* Keeps every day column at least as wide as the original per-cell min-width.
       The container's overflow-x: auto scrolls instead of squeezing columns too thin. */
    min-width: calc(30px + 7 * 110px);
    user-select: none;
    touch-action: manipulation;

    --step-height: 12px;
    --event-gap: 4px;
  }

  colgroup col:first-child {
    /* Just wide enough for a time label like "14". The other columns split the rest evenly. */
    width: 30px;
  }

  thead th,
  thead td {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--color-white);
    ${fontMedium};
    font-size: var(--fontsize-body-m);
    text-align: center;
    padding: var(--spacing-2-xs) var(--spacing-xs);
    border-bottom: 1px solid var(--border-color);
  }

  thead td {
    border: none;
    padding: 0;
  }

  tbody th {
    ${fontMedium};
    font-size: var(--fontsize-body-m);
    font-weight: normal;
    text-align: center;
    vertical-align: middle;
    padding: 0 var(--spacing-xs);
    white-space: nowrap;
  }

  tbody td {
    position: relative;
    box-sizing: border-box;
    padding: 0;
    border-inline: 1px solid var(--border-color);
    background: var(--color-white);
    width: 110px;
    height: var(--step-height);
    cursor: pointer;
    text-align: center;
    font-size: 10px;
    line-height: 0.9;
    color: transparent;
    transition:
      color 0.1s ease-in-out,
      background 0.1s ease-in-out,
      box-shadow 0.1s ease-in-out;

    &[data-hour-start]:not([data-appearance="primary"], [data-appearance="secondary"]) {
      border-top: 1px solid var(--border-color);
    }

    &[data-availability="closed"] {
      background-image: ${unavailableBackgroundSVG};
      background-size: auto var(--step-height);
      background-color: var(--color-black-5);
      background-repeat: repeat;
      cursor: default;
      border: none;
      border-inline: none;

      --border-color: transparent;
    }

    &[data-appearance="primary"] {
      ${eventBackground("primary")};
      text-align: right;
    }

    &[data-appearance="secondary"] {
      ${eventBackground("secondary")};
      border-inline: 1px solid var(--border-color);
      &[data-run-start]::before {
        box-shadow: inset 0 1px 0 var(--color-black-50);
      }
      &[data-run-end]::before {
        box-shadow: inset 0 -1px 0 var(--color-black-50);
      }
      &[data-run-start][data-run-end]::before {
        box-shadow:
          inset 0 1px 0 var(--color-black-50),
          inset 0 -1px 0 var(--color-black-50);
      }
    }

    /* The arrow only marks where a run begins, not every cell in it. */
    &[data-appearance="primary"][data-run-start] {
      ${primaryIndicator};
    }

    &[data-appearance="secondary"][data-run-start] {
      ${secondaryIndicator};
    }

    &:focus-visible {
      outline: 3px solid var(--color-focus-outline);
      outline-offset: -3px;
      z-index: 1;
    }
  }

  [data-readonly] td,
  [data-disabled] td {
    cursor: default;
  }

  tr:last-child td {
    border-bottom: 1px solid var(--border-color);
  }

  table:not([aria-readonly]) tbody td:not([data-availability="closed"], [data-appearance]):hover {
    color: var(--color-black-30);
    background: var(--color-black-10);
  }
`;

const LegendList = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: var(--spacing-xs);
  margin: 0;
  padding: 0;
  list-style: none;
`;

const LegendItemRow = styled.li`
  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);
  white-space: nowrap;

  &[aria-current="true"] {
    font-family: var(--font-bold), sans-serif;
  }
`;

const LegendBox = styled.div<{ $state: LegendState }>`
  position: relative;
  box-sizing: border-box;
  width: 30px;
  height: 30px;
  border: 1px solid var(--color-black-50);
  background-color: ${({ $state }) => ($state === "closed" ? "var(--color-black-5)" : "var(--color-white)")};
  ${({ $state }) => ($state === "primary" ? primaryFragment : $state === "secondary" ? secondaryFragment : "")}
  ${({ $state }) => $state === "closed" && `background-image: ${unavailableBackgroundSVG}; background-size: auto 10px; background-repeat: repeat;`}
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
