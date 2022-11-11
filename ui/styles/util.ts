import { fontMedium } from "common/src/common/typography";
import { Button } from "hds-react";
import styled, { css, CSSProperties } from "styled-components";

export const truncatedText = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const pixel =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

export const MediumButton = styled(Button)``;

export const BlackButton = styled(Button).attrs({
  style: {
    "--color-button-primary": "var(--color-black-90)",
    "--color-bus": "var(--color-black-90)",
  },
})`
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
