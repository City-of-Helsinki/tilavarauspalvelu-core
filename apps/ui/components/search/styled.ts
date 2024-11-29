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
  $justifyContent: "space-between",
  $alignItems: "center",
  $marginTop: "m",
})`
  /* have to use flex-flow: otherwise on desktop the button will be split to the second line */
  flex-flow: column nowrap;
  @media (min-width: ${breakpoints.m}) {
    flex-flow: row nowrap;
  }
`;

// Have to set max-width so this doesn't grow inside a flex container
export const StyledSubmitButton = styled(SubmitButton)`
  @media (min-width: ${breakpoints.s}) {
    max-width: fit-content;
  }
`;
