import { get } from "lodash";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { Table, TableProps } from "@/common/hds-fork/table/Table";

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
      text-align: left;
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

type Props = TableProps & {
  setSort?: (col: string) => void;
  isLoading?: boolean;
};

// @param isLoading - if true, table is rendered with a loading overlay
// TODO overlay and spinner for loading would be preferable over colour switching
export const CustomTable = ({ isLoading, ...props }: Props): JSX.Element => (
  <StyledTable
    // NOTE have to unmount on data changes because there is a bug in the Table component
    // removing this and using sort leaves ghost elements in the table.
    key={JSON.stringify(props.rows)}
    $headingBackground={
      isLoading ? "var(--color-black-20)" : "var(--color-black-10)"
    }
    $tableBackground={
      isLoading ? "var(--color-black-10)" : "var(--color-white)"
    }
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
