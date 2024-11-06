import { Dialog } from "hds-react";
import styled from "styled-components";
import { Link } from "react-router-dom";

export const TableLink = styled(Link)`
  color: black;
`;

// NOTE not using IconButton because of hover effect
export const ExternalTableLink = styled(Link).attrs({
  target: "_blank",
  rel: "noopener noreferrer",
})`
  color: var(--color-black);
  display: flex;
  align-items: center;
  gap: var(--spacing-3-xs);
  & > svg {
    margin-top: var(--spacing-3-xs);
  }
`;

export const DialogActionsButtons = styled(Dialog.ActionButtons)`
  justify-content: space-between;
`;

export const Element = styled.div<{
  $wide?: boolean;
  $start?: boolean;
  $unlimitedMaxWidth?: boolean;
}>`
  grid-column: ${({ $wide, $start }) =>
    $wide ? "1 / -1" : $start ? "1 / span 1" : "auto / span 1"};
  max-width: ${({ $unlimitedMaxWidth }) =>
    $unlimitedMaxWidth ? "inherit" : "var(--prose-width)"};
`;
