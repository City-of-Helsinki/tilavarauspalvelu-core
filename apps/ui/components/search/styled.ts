import styled from "styled-components";
import { Flex } from "common/styled";
import { breakpoints } from "common/src/const";
import { SubmitButton } from "@/styled/util";

export const SearchButtonContainer = styled(Flex).attrs({
  $justifyContent: "space-between",
  $alignItems: "center",
})`
  && {
    /* have to use flex-flow: otherwise on desktop the button will be split to the second line */
    flex-flow: column nowrap;
    @media (min-width: ${breakpoints.m}) {
      flex-flow: row nowrap;
    }
  }
`;

// Have to set max-width so this doesn't grow inside a flex container
export const StyledSubmitButton = styled(SubmitButton)`
  @media (min-width: ${breakpoints.s}) {
    max-width: fit-content;
  }
`;
