import { fontMedium, fontRegular } from "ui/src/styled";
import { Button, Stepper } from "hds-react";
import Link from "next/link";
import styled from "styled-components";
import { breakpoints } from "@ui/modules/const";

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
  flex-grow: 1;
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

export const StyledStepper = styled(Stepper)`
  /* HDS uses fixed width for the stepper content, make sure it's long enough for all variations (single line). */
  & {
    --hds-step-width: 155px;
  }
  /* HDS stepper line breaks aggressively while adding extra white space */
  p {
    white-space: nowrap;
    @media (max-width: ${breakpoints.m}) {
      white-space: unset;
    }
  }
`;
