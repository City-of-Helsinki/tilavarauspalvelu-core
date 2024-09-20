import React from "react";
import {
  getStatusBackgroundColor,
  getStatusBorderColor,
  StatusLabelType,
  StyledTag,
} from "../tags";
import styled from "styled-components";

type TagPropsType = {
  ariaLabel: string;
  type: StatusLabelType;
  onClick?: () => void;
  id?: string;
  children: React.ReactNode;
};

const ColoredTag = styled(StyledTag)<{ $type: StatusLabelType }>`
  && {
    --tag-background: ${(props) =>
      getStatusBackgroundColor(props.$type)} !important;
    --tag-color: var(--color-black);
    border-width: 1px;
    border-style: solid;
    border-color: ${(props) => getStatusBorderColor(props.$type)};
    white-space: nowrap;
  }
`;

function Tag({
  ariaLabel,
  type = "neutral",
  id,
  children,
  onClick,
}: TagPropsType): JSX.Element {
  return (
    <ColoredTag $type={type} id={id} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </ColoredTag>
  );
}

export default Tag;
