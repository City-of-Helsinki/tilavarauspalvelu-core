import styled from "styled-components";
import { Tag } from "hds-react";
import { Flex } from "./index";

export const SearchTagContainer = styled(Flex).attrs({
  $gap: "s",
  $direction: "row",
  $wrap: "wrap",
  $alignItems: "center",
})``;

export const SearchTag = styled(Tag)`
  --tag-font-size: var(--fontsize-body-s);
  svg {
    scale: 0.8;
  }
  &,
  svg {
    transition: all 200ms linear;
  }
  &:focus {
    && {
      box-shadow: 0 0 0 3px var(--color-black-80);
    }
  }
  &:active {
    background: var(--color-black-80);
    color: var(--color-white);
  }
  svg:hover {
    scale: 1;
  }
`;

export const TagResetButton = styled(SearchTag)`
  --background-color: transparent;
  border: 1px var(--color-black-80) solid;
  &:hover {
    background: var(--color-black-10);
  }
`;
