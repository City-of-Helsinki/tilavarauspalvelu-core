import React from "react";
import { getStatusBackgroundColor, getStatusBorderColor, StatusLabelType, StyledTag } from "../tags";
import styled from "styled-components";

type TagPropsType = {
  ariaLabel?: string;
  type?: StatusLabelType;
  onClick?: () => void;
  children: string;
};

const ColoredTag = styled(StyledTag)<{ $type: StatusLabelType }>`
  & {
    --background-color: ${(props) => getStatusBackgroundColor(props.$type)};
    --tag-color: var(--color-black);
    border-width: 1px;
    border-style: solid;
    border-color: ${(props) => getStatusBorderColor(props.$type)};
    white-space: nowrap;
  }
`;

export function Tag({ ariaLabel, type = "neutral", children, onClick }: TagPropsType): JSX.Element {
  return (
    <ColoredTag $type={type} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </ColoredTag>
  );
}
