import styled from "styled-components";
import { ButtonCss, ButtonStyleProps } from "common/styles/buttonCss";
import Link from "next/link";
import { fontMedium } from "common";

/* small overrides that might be moved to buttonCss.ts after testing
 * gap: in case there is an icon
 * max-height since the small button this replaces is 40px + 4px padding
 */
export const ButtonLikeLink = styled(Link)<ButtonStyleProps>`
  ${ButtonCss}
  ${fontMedium}
  max-height: 40px;
  gap: var(--spacing-s);
`;
