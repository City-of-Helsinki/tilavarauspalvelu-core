import styled from "styled-components";
import { fontMedium, ButtonCss, ButtonStyleProps } from "common/styled";
import Link from "next/link";

/* small overrides that might be moved to buttonCss.ts after testing
 * gap: in case there is an icon
 * max-height since the small button this replaces is 40px + 4px padding
 */
export const ButtonLikeLink = styled(Link)<ButtonStyleProps>`
  ${ButtonCss}
  ${fontMedium}
  gap: var(--spacing-s);
  white-space: nowrap;
`;

export const ButtonLikeExternalLink = styled.a<ButtonStyleProps>`
  ${ButtonCss}
  ${fontMedium}
  gap: var(--spacing-s);
  white-space: nowrap;
`;
