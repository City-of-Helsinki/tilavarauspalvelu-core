import styled from "styled-components";
import { breakpoints } from "common/src/common/style";

export { CenterSpinner } from "common/styles/util";

export const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  margin-top: var(--spacing-layout-l);
  padding: var(--spacing-l) 0 var(--spacing-layout-l) 0;
  justify-content: space-between;
  gap: var(--spacing-m);
  border-top: 1px solid var(--color-black-60);

  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
  }
`;
