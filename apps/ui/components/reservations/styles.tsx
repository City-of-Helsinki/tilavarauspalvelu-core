import { Container } from "common";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { H1 } from "common/src/common/typography";

/* TODO margins should be in page layout component, not custom for every page */
/* TODO don't inherit from Container, it's deprecated */
export const ReservationPageWrapper = styled(Container)<{ $nRows?: number }>`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: ${({ $nRows }) => `repeat(${$nRows ?? 4}, auto)`};
  grid-gap: var(--spacing-m);
  justify-content: space-between;
  margin: 0;
  padding: 0;

  @media (width > ${breakpoints.l}) {
    grid-template-columns: 2fr 1fr;
  }
`;

/* There is no breadcrumbs on this page so remove the margin */
export const Heading = styled(H1)`
  grid-column: 1 / -1;
`;
