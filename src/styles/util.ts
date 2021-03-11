import { Checkbox, ErrorSummary, Navigation } from "hds-react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { ApplicationStatus } from "../common/types";

export const breakpoints = {
  xs: "320px",
  s: "576px",
  m: "768px",
  l: "992px",
  xl: "1248px",
};

export const getGridFraction = (space: number, columns = 12): number => {
  const fraction = (space / columns) * 100;
  return fraction > 0 ? fraction : 0;
};

export const getStatusColor = (
  status: ApplicationStatus,
  size: "s" | "l"
): string => {
  let color = "";
  switch (status) {
    case "draft":
    case "in_review":
    case "allocated":
      color = "var(--color-info)";
      break;
    case "review_done":
    case "validated":
    case "handled":
      color = "var(--color-success)";
      break;
    case "declined":
    case "cancelled":
      switch (size) {
        case "s":
          color = "var(--color-error)";
          break;
        case "l":
        default:
          color = "var(--color-error-dark)";
      }
      break;
    default:
  }

  return color;
};

export const Seranwrap = styled.div`
  height: 200%;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: var(--tilavaraus-admin-stack-seranwrap);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: black;
  opacity: 0.2;
`;

export const StatusDot = styled.div<{
  status: ApplicationStatus;
  size: number;
}>`
  display: inline-block;
  width: ${({ size }) => size && `${size}px`};
  height: ${({ size }) => size && `${size}px`};
  border-radius: 50%;
  background-color: ${({ status }) => getStatusColor(status, "s")};
`;

export const InlineErrorSummary = styled(ErrorSummary)`
  margin: var(--spacing-l);
  width: 40%;
`;

export const BasicLink = styled(Link)`
  color: var(--tilavaraus-admin-content-text-color);
  text-decoration: none;
  user-select: none;
`;

export const StyledHDSNavigation = styled(Navigation)`
  --breakpoint-xl: 9000px;
`;

export const SelectionCheckbox = styled(Checkbox).attrs({
  style: {
    "--label-padding": "0",
  } as React.CSSProperties,
})``;
