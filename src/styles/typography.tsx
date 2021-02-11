import styled from "styled-components";

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
  font-size: var(--fontsize-body-s);
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: bold;
  line-height: 1.85em;
`;

export const truncatedText = `
  white-space: nowrap;
  overflow-x: hidden;
  text-overflow: ellipsis;
`;
