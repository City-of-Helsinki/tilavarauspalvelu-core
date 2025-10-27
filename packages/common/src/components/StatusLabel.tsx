import type { StatusLabelType as HDSStatusLabelType } from "hds-react";
import React from "react";
import { StatusLabel as HDSStatusLabel } from "hds-react";
import styled from "styled-components";

type StatusLabelProps = {
  type: StatusLabelType;
  icon?: JSX.Element;
  slim?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const ColoredLabel = styled(HDSStatusLabel)<{
  $type: StatusLabelType;
  $slim?: boolean;
}>`
  && {
    --status-label-background: ${(props) => getStatusBackgroundColor(props.$type)} !important;
    --status-label-color: var(--color-black);
    border-width: 1px;
    border-style: solid;
    border-color: ${(props) => getStatusBorderColor(props.$type)};
    white-space: nowrap;
    margin-block: ${(props) => (props.$slim ? "-6px" : "unset")};
  }
  svg {
    scale: 0.8;
  }
`;

/* @name StatusLabel
 * @description StatusLabel component (extends HDS StatusLabel with "draft" type)
 * @param {StatusLabelWithDraftType} type - StatusLabel type (neutral, info, alert, success, error, draft)
 * @param {JSX.Element} icon - Icon element
 * @param {boolean} slim - Toggle slim mode, for use in tight layouts (e.g. tables) (uses negative block margins)
 * @param {string} dataTestId - Test id
 * @param {React.ReactNode} children - Label text
 * @returns {JSX.Element} - Rendered StatusLabel component
 */
function StatusLabel({ type, icon, slim = false, children, ...rest }: Readonly<StatusLabelProps>): JSX.Element {
  return (
    <ColoredLabel
      {...rest}
      type={type === "draft" ? "neutral" : type} // HDS StatusLabel does not support "draft" type - so convert it to "neutral"
      iconStart={icon}
      $type={type}
      $slim={slim}
    >
      {children}
    </ColoredLabel>
  );
}

export default StatusLabel;

export type StatusLabelType = HDSStatusLabelType | "draft";

export const getStatusBorderColor = ($type: StatusLabelType) => {
  switch ($type) {
    case "info":
      return "var(--color-coat-of-arms-medium-light)";
    case "alert":
      return "var(--color-engel-dark)";
    case "success":
      return "var(--color-tram-medium-light)";
    case "error":
      // using custom value since there is no suitable color in the HDS color palette for this (--color-metro is too dark)
      return "#FBA782";
    case "draft":
      return "var(--color-suomenlinna)";
    case "neutral":
    default:
      return "var(--color-silver-dark)";
  }
};

export const getStatusBackgroundColor = ($type: StatusLabelType) => {
  switch ($type) {
    case "info":
      return "var(--color-coat-of-arms-light)";
    case "alert":
      return "var(--color-engel-medium-light)";
    case "success":
      return "var(--color-tram-light)";
    case "error":
      return "var(--color-metro-medium-light)";
    case "draft":
      return "var(--color-suomenlinna-medium-light)";
    case "neutral":
    default:
      return "var(--color-silver)";
  }
};
