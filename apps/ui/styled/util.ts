import { fontMedium, fontRegular } from "common/styled";
import { Button } from "hds-react";
import Link from "next/link";
import styled from "styled-components";

export const pixel = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

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
  && {
    width: 100%;
  }
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
