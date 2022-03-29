import styled, { css } from "styled-components";
import { breakpoints } from "./util";

export const H1 = styled.h1`
  font-size: 2.5em;
  font-family: var(--font-regular);
  font-weight: 400;
  line-height: var(--lineheight-s);
  margin: var(--spacing-s) 0 var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    font-size: 3em;
    line-height: var(--lineheight-s);
  }
`;

export const H2 = styled.h2`
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-regular);
  font-weight: 400;
  line-height: var(--lineheight-s);
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    font-size: 2em;
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
  font-weight: 500;
  line-height: var(--lineheight-m);
  margin-bottom: var(--spacing-s);

  @media (min-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-m);
    line-height: var(--lineheight-xl);
  }
`;

export const H5 = styled.h5`
  font-size: var(--fontsize-heading-xs);
  font-family: var(--font-medium);
  font-weight: 500;
  line-height: 1.625;
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-s);
    line-height: var(--lineheight-l);
  }
`;
export const H5Top = styled(H5)`
  margin-top: 0;
`;

export const truncatedText = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ContentHeading = styled(H1)`
  @media (min-width: ${breakpoints.xl}) {
    width: 60%;
  }

  padding-right: var(--spacing-l);
`;

export const RequiredLabel = css`
  &:after {
    content: "*";
    position: relative;
    margin-left: var(--spacing-2-xs);
    font-family: var(--tilavaraus-admin-font-bold);
    font-weight: 700;
  }
`;
