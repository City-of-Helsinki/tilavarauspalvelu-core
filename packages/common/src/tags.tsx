import styled from "styled-components";
import { Tag } from "hds-react";
import type { StatusLabelType as HDSStatusLabelType } from "hds-react";

export const FilterTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-s);
  flex-grow: 1;
`;

export const StyledTag = styled(Tag)`
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

export const ResetButton = styled(StyledTag).attrs({
  theme: {
    "--tag-background": "transparent",
  },
})`
  border: 1px var(--color-black-80) solid;
  &:hover {
    background: var(--color-black-10);
  }
`;

export type StatusLabelType = HDSStatusLabelType | "draft";

export const getStatusBorderColor = ($type: StatusLabelType) => {
  switch ($type) {
    case "info":
      return "var(--color-coat-of-arms-medium-light)";
    case "alert":
      return "var(--color-engel-dark)";
    case "success":
      return "var(--color-tram-medium-light)";
    case "error":
      // using custom value since there is no suitable color in the HDS color palette for this (--color-metro is too dark)
      return "#FBA782";
    case "draft":
      return "var(--color-suomenlinna)";
    case "neutral":
    default:
      return "var(--color-silver-dark)";
  }
};

export const getStatusBackgroundColor = ($type: StatusLabelType) => {
  switch ($type) {
    case "info":
      return "var(--color-coat-of-arms-light)";
    case "alert":
      return "var(--color-engel-medium-light)";
    case "success":
      return "var(--color-tram-light)";
    case "error":
      return "var(--color-metro-medium-light)";
    case "draft":
      return "var(--color-suomenlinna-medium-light)";
    case "neutral":
    default:
      return "var(--color-silver)";
  }
};
