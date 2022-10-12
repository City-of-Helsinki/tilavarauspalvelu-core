import styled from "styled-components";
import { breakpoints } from "common/src/common/style";

export const SubHeading = styled.div`
  margin-top: var(--spacing-xs);
  font-size: var(--fontsize-heading-l);
  font-family: var(--font-bold);

  @media (max-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-m);
  }
`;

export const HeroSubheading = styled.p`
  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-xl);
`;
