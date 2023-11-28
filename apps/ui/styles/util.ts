import { fontMedium } from "common/src/common/typography";
import { Button, Notification } from "hds-react";
import styled, { css, CSSProperties } from "styled-components";

export const truncatedText = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const pixel =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

export const MediumButton = styled(Button)`
  font-size: var(--fontsize-body-m);
  ${fontMedium};
`;

export const BlackButton = styled(Button)`
  font-size: var(--fontsize-body-m);
  ${fontMedium};
`;

export const SupplementaryButton = styled(Button).attrs({
  style: {} as CSSProperties,
})`
  &&& {
    --color-bus: transparent;
    --border-color: transparent;
    --border-color-hover: transparent;
    --border-color-focus: var(--color-coat-of-arms);
    --border-color-hover-focus: var(--color-coat-of-arms);
    --border-color-disabled: transparent;
    --focus-outline-color: transparent;
    --submit-input-focus-gutter-color: transparent;
  }
`;

export const NoWrap = styled.span`
  white-space: nowrap;
`;

export const arrowUp = css`
  content: "";
  position: absolute;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 8px solid transparent;
`;

export const arrowDown = css`
  content: "";
  position: absolute;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 8px solid var(--color-white);
`;

export const LinkButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0;
  ${fontMedium};
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
`;

export const Toast = styled(Notification)`
  --notification-z-index-toast: var(--tilavaraus-stack-order-toast);
`;
