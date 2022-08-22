import {
  Button,
  Checkbox,
  ErrorSummary,
  Navigation,
  Notification,
} from "hds-react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import {
  ApplicationEventStatus,
  ApplicationStatus,
  NormalizedApplicationRoundStatus,
} from "../common/types";
import { getApplicationStatusColor } from "../component/applications/util";

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

export const getApplicationEventStatusColor = (
  status: ApplicationEventStatus,
  size: "s" | "l"
): string => {
  let color = "";
  switch (status) {
    case "created":
    case "allocated":
      color = "var(--color-info)";
      break;
    case "validated":
      color = "var(--color-success)";
      break;
    case "approved":
      color = "var(--color-alert-light)";
      break;
    case "ignored":
    case "declined":
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

export const getApplicationRoundStatusColor = (
  status: NormalizedApplicationRoundStatus | "incoming"
): string => {
  let color = "";
  switch (status) {
    case "handling":
      color = "var(--color-info)";
      break;
    case "validated":
      color = "var(--color-alert-light)";
      break;
    case "approved":
    case "sent":
      color = "var(--color-success)";
      break;
    case "draft":
    case "incoming":
    default:
      color = "var(--color-silver)";
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
  background-color: ${({ status }) => getApplicationStatusColor(status, "s")};
`;

export const ApplicationEventStatusDot = styled.div<{
  status: ApplicationEventStatus;
  size: number;
}>`
  display: inline-block;
  width: ${({ size }) => size && `${size}px`};
  height: ${({ size }) => size && `${size}px`};
  border-radius: 50%;
  background-color: ${({ status }) =>
    getApplicationEventStatusColor(status, "s")};
`;

export const InlineErrorSummary = styled(ErrorSummary)`
  margin: var(--spacing-l);
  width: 40%;
`;

export const BasicLink = styled(Link)`
  color: var(--tilavaraus-admin-content-text-color);
  text-decoration: none;
  user-select: none;
  display: inline-flex;
  align-content: center;
  align-items: center;
  gap: var(--spacing-xs);
`;

export const InlineRowLink = styled(BasicLink).attrs({
  onClick: (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
  },
})`
  &:hover {
    opacity: 0.5;
  }

  font-family: var(--tilavaraus-admin-font-medium);
  font-weight: 500;
  text-decoration: underline;
`;

export const StyledHDSNavigation = styled(Navigation)`
  --breakpoint-xl: 9000px;
  .btn-logout {
    span {
      margin: 0;
    }
  }
`;

export const SelectionCheckbox = styled(Checkbox).attrs({
  style: {
    "--label-padding": "0",
  } as React.CSSProperties,
})``;

export const Strong = styled.span`
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: 700;
`;

export const Divider = styled.hr`
  background-color: var(--color-silver);
  height: 1px;
  border: 0;
  margin: var(--spacing-3-xl) 0;
  grid-column: 1/-1;
`;

export const PlainButton = styled(Button).attrs({
  variant: "secondary",
  style: {
    "--color-bus": "var(--color-black)",
  },
})``;

export const NotificationBox = styled.div`
  background-color: var(--tilavaraus-admin-gray-darker);
  padding: 110px var(--spacing-layout-m) 100px;
  text-align: center;
  white-space: pre-line;
  line-height: var(--lineheight-xl);
  margin-bottom: var(--spacing-5-xl);
`;

export const ButtonsStripe = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  justify-content: space-between;
  right: 0;
  display: flex;
  padding: var(--spacing-s);
  background-color: var(--color-bus-dark);
  z-index: var(--tilavaraus-admin-button-stripe-stack);
`;

export const WhiteButton = styled(Button)<{
  disabled: boolean;
  variant: "secondary" | "primary" | "supplementary";
}>`
  --bg: var(--color-white);
  --fg: var(--color-black);
  --hbg: var(--fg);
  --hfg: var(--bg);
  --border-color: var(--color-white);

  ${({ variant }) => {
    switch (variant) {
      case "secondary":
        return `--fg: var(--color-white);
      --bg: var(--color-bus-dark);`;
      case "supplementary":
        return `--fg: var(--color-white);
        --bg: var(--color-bus-dark);
        --border-color: transparent;`;
      default:
        return "";
    }
  }}

  ${({ disabled }) =>
    disabled
      ? `--hbg: var(--bg);
        --hfg: var(--fg);
      `
      : null}


  height: 52px;
  border: 2px var(--border-color) solid !important;

  color: var(--fg) !important;
  background-color: var(--bg) !important;

  &:hover {
    color: var(--hfg) !important;
    background-color: var(--hbg) !important;
  }
  margin: 0;
`;

export const StyledNotification = styled(Notification)`
  z-index: var(--tilavaraus-admin-notification-stack);
  margin: var(--spacing-xs) var(--spacing-layout-2-xs);
  width: auto;
  @media (min-width: ${breakpoints.xl}) {
    margin: var(--spacing-s) var(--spacing-layout-xl);
  }
`;
