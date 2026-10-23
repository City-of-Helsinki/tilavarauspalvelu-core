import styled, { css } from "styled-components";
import { unavailableBackgroundSVG } from "@ui/components/calendar/utils";
import { fontBold } from "@ui/styled";

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

export const HiddenText = styled.span`
  ${visuallyHidden};
`;

/**
 * The table every time grid shares: fixed columns, a sticky header, cells of one step's height, closed cells and
 * the focus ring. The calendar sets the sizes it wants through these custom properties on its root:
 * `--border-color`, `--step-height`, `--time-column-width`, and optionally `--closed-pattern-height`.
 */
export const gridTableStyles = css`
  table {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    width: 100%;
  }

  colgroup col:first-child {
    width: var(--time-column-width);
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
    user-select: none;
  }

  tbody th {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--color-white);
    user-select: none;
  }

  tbody td {
    position: relative;
    box-sizing: border-box;
    height: var(--step-height);
    border-inline: 1px solid var(--border-color);
    background: var(--color-white);

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
`;
