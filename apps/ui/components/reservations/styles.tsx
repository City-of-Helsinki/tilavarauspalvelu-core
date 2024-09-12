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

  @media (width > ${breakpoints.l}) {
    grid-template-columns: 2fr 1fr;
  }
`;

/* There is no breadcrumbs on this page so remove the margin */
export const Heading = styled(H2).attrs({ as: "h1" })`
  grid-column: 1 / -1;
  margin-top: 0;
`;
