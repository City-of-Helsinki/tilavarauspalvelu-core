import styled from "styled-components";
import { breakpoints } from "./util";

export const H1 = styled.h1`
  font-size: 4rem;
  font-weight: 400;
  font-family: var(--font-regular);
  line-height: var(--lineheight-s);
  margin: var(--spacing-s) 0 var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    font-size: 3em;
  }
`;

export const H2 = styled.h2`
  font-size: 2em;
  font-weight: 400;
  font-family: var(--font-regular);
  line-height: var(--lineheight-s);
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    font-size: 3em;
    line-height: var(--lineheight-m);
  }
`;

export const H3 = styled.h3`
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-regular);
  font-weight: 400;
  line-height: 2rem;
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    font-size: 2rem;
  }
`;

export const H4 = styled.h4`
  font-size: var(--fontsize-heading-s);
  font-family: var(--font-medium);
  line-height: var(--lineheight-m);
  margin-bottom: var(--spacing-s);
  font-weight: 500;

  @media (min-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-m);
    line-height: var(--lineheight-xl);
  }
`;

export const SlimH4 = styled(H4)`
  margin: 0;
`;

export const H5 = styled.h5`
  font-size: var(--fontsize-heading-xs);
  font-family: var(--font-bold);
  font-weight: 500;
  line-height: 1.625;
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-s);
    line-height: var(--lineheight-l);
  }
`;

export const H6 = styled.h6`
  font-size: var(--fontsize-heading-xxs);
  font-family: var(--font-bold);
  font-weight: 700;
  line-height: var(--lineheight-l);

  @media (min-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-xs);
    line-height: var(--lineheight-l);
  }
`;
