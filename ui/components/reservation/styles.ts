import { breakpoints } from "common/src/common/style";
import styled from "styled-components";
import { H4, H5 } from "common/src/common/typography";

export const Paragraph = styled.p`
  white-space: pre-line;

  & > span {
    display: block;
  }
`;

export const Subheading = styled(H4)``;

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

export const ActionContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  margin-bottom: var(--spacing-layout-m);

  button {
    margin-bottom: var(--spacing-m);
  }

  @media (min-width: ${breakpoints.s}) {
    & > button:first-of-type {
      order: 1;
    }

    display: flex;
    gap: var(--spacing-m);
    justify-content: flex-end;
  }
`;
