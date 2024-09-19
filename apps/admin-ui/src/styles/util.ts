import { Dialog } from "hds-react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import StatusLabel from "common/src/components/StatusLabel";

export const Seranwrap = styled.div`
  height: 200%;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: var(--tilavaraus-admin-stack-seranwrap);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: black;
  opacity: 0.2;
`;

// TODO link component naming?
export const BasicLink = styled(Link)`
  color: var(--tilavaraus-admin-content-text-color);
  text-decoration: none;
  user-select: none;
  display: inline-flex;
  align-content: center;
  align-items: center;
  gap: var(--spacing-xs);
`;

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

// StatusLabels expand the table cell without this, as they're too high au naturel
export const TableStatusLabel = styled(StatusLabel)`
  margin-block: -6px;
`;
