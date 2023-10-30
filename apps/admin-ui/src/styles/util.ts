import { Button, Checkbox, Navigation, Notification } from "hds-react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { breakpoints } from "common/src/common/style";

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

export const BasicLink = styled(Link)`
  color: var(--tilavaraus-admin-content-text-color);
  text-decoration: none;
  user-select: none;
  display: inline-flex;
  align-content: center;
  align-items: center;
  gap: var(--spacing-xs);
`;

export const StyledHDSNavigation = styled(Navigation)`
  --breakpoint-xl: 9000px;
  z-index: var(--tilavaraus-admin-stack-main-menu);
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

export const Divider = styled.hr`
  background-color: var(--color-silver);
  height: 1px;
  border: 0;
  margin: var(--spacing-3-xl) 0;
  grid-column: 1/-1;
`;

/// @deprecated
export const ButtonsStripe = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  justify-content: space-between;
  right: 0;
  display: flex;
  padding: var(--spacing-s);
  background-color: var(--color-bus-dark);
  z-index: var(--tilavaraus-admin-stack-button-stripe);
`;

/// @deprecated use Standard Button instead
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

/// @deprecated use Notification context instead
export const StyledNotification = styled(Notification)`
  z-index: var(--tilavaraus-admin-stack-notification);
  margin: var(--spacing-xs) var(--spacing-layout-2-xs);
  opacity: 1 !important;
  @media (min-width: ${breakpoints.xl}) {
    margin: var(--spacing-s) var(--spacing-layout-xl);
  }
`;
