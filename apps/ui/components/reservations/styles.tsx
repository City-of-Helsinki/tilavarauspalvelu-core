import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { H1 } from "common/src/common/typography";

/* TODO margins should be in page layout component, not custom for every page */
// TODO needs to have some margin / padding at the top? because we have a second column on dekstop
// and that should not be clued to the top (so we can't use H margins)
// TODO for edit page should have more rows
// (because the calendar should be taking more space without affecting the other elements)
export const ReservationPageWrapper = styled.div<{ $nRows?: number }>`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: ${({ $nRows }) => `repeat(${$nRows ?? 4}, auto)`};
  grid-gap: var(--spacing-m);
  justify-content: space-between;
  margin: 0;
  padding: 0;

  @media (width > ${breakpoints.m}) {
    grid-template-columns: 2fr 1fr;
  }
`;

// Larger breakpoint for reservation unit page because Calendar takes more space.
export const ReservationUnitPageWrapper = styled(ReservationPageWrapper)`
  @media (width > ${breakpoints.m}) {
    grid-template-columns: 1fr;
  }
  @media (width > ${breakpoints.l}) {
    grid-template-columns: 2fr 1fr;
  }
`;

/* There is no breadcrumbs on this page so remove the margin */
// TODO edit page at least should have this full sized
export const Heading = styled(H1)`
  grid-column: 1 / -1;
`;
