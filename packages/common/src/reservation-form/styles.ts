import styled from "styled-components";
import { breakpoints } from "../common/style";
import { H4, H5 } from "../common/typography";

export const Subheading = styled(H4).attrs({ as: "h2" })``;

export const GroupHeading = styled(H5)`
  grid-column: 1 / -1;
  margin-bottom: 0;
`;

export const TwoColumnContainer = styled.div`
  margin-top: var(--spacing-m);
  display: grid;
  gap: var(--spacing-m);
  align-items: baseline;
  grid-template-columns: 1fr;

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr;
  }
`;
