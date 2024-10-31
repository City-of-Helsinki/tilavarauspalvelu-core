import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { H5 } from "common/src/common/typography";

export { CenterSpinner } from "common/styles/util";

export const SpanTwoColumns = styled.span`
  display: grid;
  gap: var(--spacing-m);
  grid-column-start: 1;
  grid-column-end: 3;

  @media (max-width: ${breakpoints.m}) {
    grid-column-start: 1;
    grid-column-end: 2;
  }
`;

export const FormSubHeading = styled(H5)`
  margin: var(--spacing-m) 0 0 0;

  @media (min-width: ${breakpoints.m}) {
    grid-column-start: 1;
    grid-column-end: 3;
  }
`;

export const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  margin-top: var(--spacing-layout-l);
  padding: var(--spacing-l) 0 var(--spacing-layout-l) 0;
  justify-content: space-between;
  gap: var(--spacing-m);
  border-top: 1px solid var(--color-black-60);

  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
  }
`;
