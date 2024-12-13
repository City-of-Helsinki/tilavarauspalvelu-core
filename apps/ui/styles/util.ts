import { fontMedium, fontRegular } from "common/src/common/typography";
import { Button } from "hds-react";
import Link from "next/link";
import styled, { css } from "styled-components";

export const pixel =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

/// @deprecated
export const MediumButton = styled(Button)`
  font-size: var(--fontsize-body-m);
  ${fontMedium};
`;

/// @deprecated
export const BlackButton = styled(Button)`
  font-size: var(--fontsize-body-m);
  ${fontMedium};
`;

/// Used for making a reservation, scales the button to max container width
export const SubmitButton = styled(Button)`
  white-space: nowrap;
  && {
    width: 100%;
  }
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

// TODO there should be other link styles combine this with them
export const InlineStyledLink = styled(Link)`
  && {
    display: inline;
    color: var(--color-black);
    text-decoration: underline;
    ${fontRegular};
  }
`;
