import React from "react";
import {
  StatusLabel as HDSStatusLabel,
  type StatusLabelType as HDSStatusLabelType,
} from "hds-react";
import styled from "styled-components";

export type StatusLabelType = HDSStatusLabelType | "draft";

const handleColorType = ($type: StatusLabelType) => {
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

const ColoredLabel = styled(HDSStatusLabel)<{
  $type: StatusLabelType;
}>`
  && {
    --status-label-background: ${(props) => handleColorType(props.$type)};
    --status-label-color: var(--color-black);
    white-space: nowrap;
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
  dataTestId,
  children,
}: {
  type: StatusLabelType;
  icon: JSX.Element;
  dataTestId?: string;
  children: React.ReactNode;
}) {
  return (
    <ColoredLabel
      type={type === "draft" ? "neutral" : type} // HDS StatusLabel does not support "draft" type - so convert it to "neutral"
      iconLeft={icon}
      dataTestId={dataTestId}
      $type={type}
    >
      {children}
    </ColoredLabel>
  );
}

export default StatusLabel;
