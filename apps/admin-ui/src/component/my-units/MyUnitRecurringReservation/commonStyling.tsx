import styled from "styled-components";

export const ActionsWrapper = styled.div`
  display: flex;
  grid-column: 1 / -1;
  gap: var(--spacing-m);
  margin-top: var(--spacing-l);
  margin-bottom: var(--spacing-l);
  justify-content: end;
`;

// Three column grid on desktop and one on small screens.
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--spacing-l);
`;

export const Element = styled.div<{ $wide?: boolean; $start?: boolean }>`
  grid-column: ${({ $wide, $start }) =>
    $wide ? "1 / -1" : $start ? "1 / span 1" : "auto / span 1"};
  max-width: var(--prose-width);
`;
