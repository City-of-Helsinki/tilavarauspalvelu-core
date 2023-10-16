import { get } from "lodash";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { Table, TableProps } from "../../common/hds-fork/table/Table";

type TableWrapperProps = {
  $headingBackground?: string;
  $tableBackground?: string;
  $colWidths?: string[];
};

export const HR = styled.hr`
  border: 0;
  border-top: 1px solid var(--color-black-20);
  width: 100%;
`;

const StyledTable = styled(Table)<TableWrapperProps>`
  &&& {
    width: 100%;
    white-space: nowrap;
    border-collapse: collapse;
    th {
      font-family: var(--font-bold);
      padding: var(--spacing-xs);
      background: ${({ $headingBackground = "var(--color-black-10)" }) =>
        $headingBackground};
      position: sticky;
      top: 0;
      box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.4);
      button {
        color: black !important;
      }
    }
    td {
      padding: var(--spacing-xs);
      background: ${({ $tableBackground = "transparent" }) => $tableBackground};
    }

    ${({ $colWidths }) =>
      $colWidths &&
      $colWidths.map(
        (width, idx) => `td:nth-of-type(${idx + 1}) {width: ${width};}`
      )};
  }
`;

export const CustomTable = (
  props: TableProps & { setSort: (col: string) => void }
): JSX.Element => (
  <StyledTable
    $headingBackground="var(--color-black-10)"
    $tableBackground="var(--color-white)"
    $colWidths={
      props?.cols ? props.cols.map((col) => get(col, "width", "auto")) : []
    }
    {...props}
  />
);

const A = styled(Link)`
  color: black;
`;

// NOTE not using IconButton because of hover effect
export const ExternalTableLink = styled.a`
  color: var(--color-black);
  display: flex;
  align-items: center;
  gap: var(--spacing-3-xs);
  & > svg {
    margin-top: var(--spacing-3-xs);
  }
`;

export const TableLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}): JSX.Element => <A to={href}>{children}</A>;
