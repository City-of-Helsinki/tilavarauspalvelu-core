import styled from "styled-components";
import { Tag } from "hds-react";

export const FilterTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-s);
  margin-right: var(--spacing-m);
  flex-grow: 1;
  width: calc(100% - 120px);
`;

export const StyledTag = styled(Tag)`
  font-size: var(--fontsize-body-m);
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

export const ResetButton = styled(StyledTag).attrs({
  theme: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "--tag-background": "transparent",
  },
})`
  border: 1px var(--color-black-80) solid;
  &:hover {
    background: var(--color-black-10);
  }
`;
