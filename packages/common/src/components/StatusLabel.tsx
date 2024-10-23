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
  testId?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const ColoredLabel = styled(HDSStatusLabel)<{
  $type: StatusLabelType;
}>`
  && {
    --status-label-background: ${(props) =>
      getStatusBackgroundColor(props.$type)} !important;
    --status-label-color: var(--color-black);
    border-width: 1px;
    border-style: solid;
    border-color: ${(props) => getStatusBorderColor(props.$type)};
    white-space: nowrap;
  }
  svg {
    scale: 0.8;
  }
`;

/*
 * StatusLabel component (extends HDS StatusLabel with "draft" type)
 * @param {StatusLabelWithDraftType} type - StatusLabel type (neutral, info, alert, success, error, draft)
 * @param {JSX.Element} icon - Icon element
 * @param {string} dataTestId - Test id
 * @param {React.ReactNode} children - Label text
 * @returns {JSX.Element} - Rendered StatusLabel component
 */
function StatusLabel({
  type,
  icon,
  testId,
  children,
  ...rest
}: Readonly<StatusLabelProps>): JSX.Element {
  return (
    <ColoredLabel
      {...rest}
      type={type === "draft" ? "neutral" : type} // HDS StatusLabel does not support "draft" type - so convert it to "neutral"
      iconLeft={icon}
      dataTestId={testId}
      $type={type}
    >
      {children}
    </ColoredLabel>
  );
}

export default StatusLabel;
