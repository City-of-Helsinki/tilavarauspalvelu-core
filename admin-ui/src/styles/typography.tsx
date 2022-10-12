import styled, { css } from "styled-components";
import { H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";

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
