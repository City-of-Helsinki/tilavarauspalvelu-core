import { Container } from "common";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { H2 } from "common/src/common/typography";

/* TODO margins should be in page layout component, not custom for every page */
export const ReservationPageWrapper = styled(Container)`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(4, auto);
  grid-gap: var(--spacing-m);
  justify-content: space-between;
  margin-top: var(--spacing-l);

  @media (width > ${breakpoints.m}) {
    margin-top: var(--spacing-2-xl);
    grid-template-columns: repeat(6, 1fr);
  }
`;

export const HeadingSection = styled.div`
  grid-column: 1 / -1;
  grid-row: 1;
  @media (min-width: ${breakpoints.l}) {
    grid-column: 1 / span 4;
  }
`;

/* There is no breadcrumbs on this page so remove the margin */
export const Heading = styled(H2).attrs({ as: "h1" })`
  grid-column: 1 / -1;
  margin-top: 0;
`;

export const BylineSection = styled.div`
  grid-row: 2;
  @media (min-width: ${breakpoints.m}) {
    grid-column: span 3;
  }
  @media (min-width: ${breakpoints.l}) {
    grid-row: 1 / span 2;
    grid-column: -3 / span 2;
  }
`;
