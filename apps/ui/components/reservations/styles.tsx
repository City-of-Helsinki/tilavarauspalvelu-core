import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { H1 } from "common/src/common/typography";

const CARD_COLUMN_SIZE = 390;

export const ReservationPageWrapper = styled.div<{ $nRows?: number }>`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: ${({ $nRows }) => `repeat(${$nRows ?? 4}, auto)`};
  grid-gap: var(--spacing-m);
  justify-content: space-between;
  margin: 0;
  padding: 0;

  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr ${CARD_COLUMN_SIZE}px;
  }
`;

// Larger breakpoint for reservation unit page because Calendar takes more space.
export const ReservationUnitPageWrapper = styled(ReservationPageWrapper)`
  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr;
  }
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 2fr 1fr;
  }
`;

export const Heading = styled(H1)`
  grid-column: 1 / -1;
`;
