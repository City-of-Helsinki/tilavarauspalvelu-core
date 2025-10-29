import styled from "styled-components";
import { breakpoints } from "common/src/modules/const";

export const ActionContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    & > button:first-of-type {
      order: 1;
      {/* set min-width so the buttons retains their placements even when isLoading is triggered */}
      min-width: 130px;
    }

    display: flex;
    justify-content: flex-end;
  }
`;

export const PinkBox = styled.div`
  padding: var(--spacing-m);
  background-color: var(--color-suomenlinna-light);
`;

export const PreviewLabel = styled.div`
  color: var(--color-black-70);
  padding-bottom: var(--spacing-2-xs);
`;

export const PreviewValue = styled.div`
  font-size: var(--fontsize-body-l);
`;

export const ParagraphAlt = styled.div<{ $isWide?: boolean }>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1;"}

  & > div:first-of-type {
    margin-bottom: var(--spacing-3-xs);
  }
`;
