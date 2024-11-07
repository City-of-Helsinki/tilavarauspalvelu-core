import styled from "styled-components";
import { breakpoints, fontMedium } from "common";
import {
  ShowAllContainer,
  type ShowAllContainerProps,
} from "common/src/components";
import { Flex } from "common/styles/util";
import { SubmitButton } from "@/styles/util";

/// Filter container using responsive grid
export const Filters = styled.div`
  grid-gap: var(--spacing-m);

  /* TODO this should be a default value or a separate styled component */
  label {
    ${fontMedium}
  }

  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  align-items: baseline;
  gap: var(--spacing-m);
`;

/// Optional filters (behind an accordion toggle) with responsive grid for content
/// bit complex css because the component wasn't designed for this use case
export const OptionalFilters = styled(ShowAllContainer)<ShowAllContainerProps>`
  && {
    grid-column: 1 / -1;
    grid-template-columns: auto;
    display: grid;
  }
  & > div {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
    align-items: baseline;
    gap: var(--spacing-s);
  }
`;

export const BottomContainer = styled(Flex).attrs({
  $justify: "space-between",
  $align: "center",
})`
  /* TODO have to use this or add gap to the parent
   * there is an issue with the grid above on desktop (not mobile) having an extra gap
   */
  margin-top: var(--spacing-m);
  /* have to use flex-flow: otherwise on desktop the button will be split to the second line */
  flex-flow: column nowrap;
  @media (min-width: ${breakpoints.m}) {
    flex-flow: row nowrap;
  }
`;

// TODO setting fixed width is bad, but 100% here is too wide
export const StyledSubmitButton = styled(SubmitButton)`
  @media (min-width: ${breakpoints.s}) {
    max-width: 120px;
  }
`;
