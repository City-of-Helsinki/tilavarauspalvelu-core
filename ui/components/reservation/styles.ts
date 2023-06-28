import { breakpoints } from "common/src/common/style";
import styled from "styled-components";

export const Paragraph = styled.p`
  white-space: pre-line;

  & > span {
    display: block;
  }
`;

export const ActionContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  margin-top: var(--spacing-layout-m);
  margin-bottom: var(--spacing-layout-m);

  button {
    margin-bottom: var(--spacing-m);
  }

  @media (min-width: ${breakpoints.s}) {
    & > button:first-of-type {
      order: 1;
    }

    display: flex;
    gap: var(--spacing-m);
    justify-content: flex-end;
  }
`;
