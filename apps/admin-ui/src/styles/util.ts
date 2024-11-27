import { Dialog } from "hds-react";
import styled, { css } from "styled-components";
import { Link } from "react-router-dom";
import { breakpoints, fontMedium } from "common";

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

export const ApplicationDatas = styled.div`
  display: grid;
  gap: var(--spacing-s);
  grid-template-columns: 1fr;
  @media (min-width: ${breakpoints.s}) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const Summary = styled(ApplicationDatas)`
  padding: var(--spacing-m);
  gap: var(--spacing-s);
  background: var(--color-black-5);
`;

export const Label = styled.div<{ $isSummary?: boolean }>`
  ${({ $isSummary }) =>
    $isSummary &&
    css`
      color: var(--color-black-70);
      display: inline-block;
    `};
`;

export const Value = styled.div<{ $isSummary?: boolean }>`
  word-wrap: break-word;
  overflow-wrap: anywhere;
  ${({ $isSummary }) =>
    $isSummary
      ? css`
          ${fontMedium}
          white-space: pre-wrap;
          display: inline-block;
        `
      : css`
          font-size: var(--fontsize-body-l);
        `};
`;

export const KVWrapper = styled.div<{
  $isWide?: boolean;
  $isSummary?: boolean;
}>`
  grid-column: ${({ $isWide }) => ($isWide ? "1 / -1" : "")};
  ${({ $isSummary }) =>
    $isSummary &&
    css`
      display: flex;
      gap: var(--spacing-2-xs);
    `};
`;
