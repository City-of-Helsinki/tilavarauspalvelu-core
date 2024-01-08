import styled from "styled-components";
import { ButtonCss, ButtonStyleProps } from "common/styles/buttonCss";
import Link from "next/link";
import { fontMedium } from "common";

export const ButtonLikeLink = styled(Link)<ButtonStyleProps>`
  ${ButtonCss}
  ${fontMedium}
`;
