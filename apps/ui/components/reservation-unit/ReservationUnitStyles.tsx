import styled from "styled-components";

// TODO either this is in the wrong file or the name is wrong
// if it's so common to be named "Content" then it should be in a common file
export const Content = styled.div<{ $noMargin?: boolean }>`
  /* why? */
  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-l);
  white-space: pre-wrap;
  word-break: break-word;
`;
