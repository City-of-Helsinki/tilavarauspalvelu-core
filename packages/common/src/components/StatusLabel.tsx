import React from "react";
import { StatusLabel as HDSStatusLabel } from "hds-react";
import styled from "styled-components";
import {
  type StatusLabelType,
  getStatusBorderColor,
  getStatusBackgroundColor,
} from "../tags";

type StatusLabelProps = {
  type: StatusLabelType;
  icon: JSX.Element;
  slim?: boolean;
  testId?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const ColoredLabel = styled(HDSStatusLabel)<{
  $type: StatusLabelType;
  $slim?: boolean;
}>`
  && {
    --status-label-background: ${(props) =>
      getStatusBackgroundColor(props.$type)} !important;
    --status-label-color: var(--color-black);
    border-width: 1px;
    border-style: solid;
    border-color: ${(props) => getStatusBorderColor(props.$type)};
    white-space: nowrap;
    margin-block: ${(props) => (props.$slim ? "-6px" : "inherit")};
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
function StatusLabel({
  type,
  icon,
  slim = false,
  testId,
  children,
  ...rest
}: Readonly<StatusLabelProps>): JSX.Element {
  return (
    <ColoredLabel
      {...rest}
      type={type === "draft" ? "neutral" : type} // HDS StatusLabel does not support "draft" type - so convert it to "neutral"
      iconLeft={icon}
      data-testid={testId}
      $type={type}
      $slim={slim}
    >
      {children}
    </ColoredLabel>
  );
}

export default StatusLabel;
