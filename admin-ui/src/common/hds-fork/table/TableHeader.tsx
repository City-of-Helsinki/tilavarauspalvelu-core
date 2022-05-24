import React from "react";
import { useTranslation } from "react-i18next";
import { HeaderRow } from "./components/HeaderRow/HeaderRow";
import { SortingHeaderCell } from "./components/SortingHeaderCell/SortingHeaderCell";

type Props = {
  indexKey: string;
  cols: Header[];
  order: "desc" | "asc" | "unset";
  sorting: string;
  setSortingAndOrder: (k: string) => void;
};

const TableHeader = ({
  indexKey,
  cols,
  sorting,
  order,
  setSortingAndOrder,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const visibleColumns = cols.filter((column) => column.key !== indexKey);
  return (
    <table>
      <thead>
        <HeaderRow>
          {visibleColumns.map((column) => {
            if (column.isSortable) {
              return (
                <SortingHeaderCell
                  key={column.key}
                  colKey={column.key}
                  title={column.headerName}
                  ariaLabelSortButtonUnset={t("ariaLabelSortButtonUnset")}
                  ariaLabelSortButtonAscending={t(
                    "ariaLabelSortButtonAscending"
                  )}
                  ariaLabelSortButtonDescending={t(
                    "ariaLabelSortButtonDescending"
                  )}
                  setSortingAndOrder={setSortingAndOrder}
                  order={(sorting === column.key ? order : "unset") || "unset"}
                  sortIconType={column.sortIconType || "other"}
                />
              );
            }
            return (
              <th key={column.key} scope="col">
                {column.headerName}
              </th>
            );
          })}
        </HeaderRow>
      </thead>
    </table>
  );
};

export default TableHeader;

export type Header = {
  isSortable?: boolean;
  key: string;
  headerName: string;
  sortIconType?: "string" | "other";
  transform?: ({ args }: any) => string | JSX.Element; // eslint-disable-line @typescript-eslint/no-explicit-any
};
