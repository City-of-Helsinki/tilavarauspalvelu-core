import { breakpoints } from "common/src/common/style";
import styled from "styled-components";

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
      {/* set min-width so the buttons retains their placements even when isLoading is triggered */}
      min-width: 130px;
    }

    display: flex;
    gap: var(--spacing-m);
    justify-content: flex-end;
  }
`;

export const PinkBox = styled.div`
  padding: var(--spacing-m);
  background-color: var(--color-suomenlinna-light);
`;
