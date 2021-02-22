import styled from "styled-components";
import { breakpoints } from "./util";

export const H1 = styled.h1`
  font-size: var(--fontsize-heading-l);
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: bold;
  line-height: var(--lineheight-m);
`;

export const H2 = styled.h2`
  font-size: var(--fontsize-heading-m);
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: bold;
  line-height: var(--lineheight-m);
`;

export const H3 = styled.h3`
  font-size: var(--fontsize-heading-xs);
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: bold;
  line-height: 1.85em;
`;

export const truncatedText = `
  white-space: nowrap;
  overflow-x: hidden;
  text-overflow: ellipsis;
`;

export const ContentHeading = styled(H1)`
  @media (min-width: ${breakpoints.xl}) {
    width: 60%;
  }

  padding-right: var(--spacing-l);
`;
