import styled from "styled-components";
import { H4, H5 } from "../common/typography";
import { breakpoints } from "../common/style";

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
  @media (width > ${breakpoints.m}) {
    grid-template-columns: 1fr 1fr;
  }
`;
