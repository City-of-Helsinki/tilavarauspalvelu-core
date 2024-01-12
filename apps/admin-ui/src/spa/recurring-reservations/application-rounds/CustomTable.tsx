import { Table, TableProps } from "hds-react";
import React from "react";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";

type TableWrapperProps = {
  $headingBackground?: string;
  $tableBackground?: string;
};

const TableWrapper = styled.div<TableWrapperProps>`
  div {
    overflow-x: auto;
    @media (min-width: ${breakpoints.xl}) {
      overflow-x: unset !important;
    }
  }

  caption {
    text-align: end;
  }
  table {
    th {
      font-family: var(--font-bold);
      padding: var(--spacing-xs);
      background: ${({ $headingBackground = "var(--color-black-10)" }) =>
        $headingBackground};
      position: sticky;
      top: 0;
      box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.4);
    }
    td {
      white-space: nowrap;
      padding: var(--spacing-xs);
      background: ${({ $tableBackground = "transparent" }) => $tableBackground};
    }
  }
`;

/// Styled version of HDS Table
/// Compared to the StyledTable in components.tsx, this version uses HDS, while that one is custom code
/// Leaving this primarily because we want to remove the custom implementation if possible
export const StyledHDSTable = (props: TableProps): JSX.Element => (
  <TableWrapper
    $headingBackground="var(--color-black-10)"
    $tableBackground="var(--color-white)"
  >
    <Table {...props} />
  </TableWrapper>
);
