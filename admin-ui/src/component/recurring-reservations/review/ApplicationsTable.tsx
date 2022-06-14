import React from "react";
import { TFunction, useTranslation } from "react-i18next";
import { memoize } from "lodash";
import { CustomTable, DataOrMessage, TableLink } from "../../lists/components";

import { ApplicationView, truncate } from "../util";
import { applicationDetailsUrl } from "../../../common/urls";

const unitsTruncateLen = 23;
const applicantTruncateLen = 20;

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  sort?: Sort;
  sortChanged: (field: string) => void;
  applications: ApplicationView[];
};

const getColConfig = (t: TFunction) => [
  {
    headerName: t("Application.headings.customer"),
    isSortable: true,
    key: "applicant",
    transform: ({ applicant, id }: ApplicationView) => (
      <TableLink href={applicationDetailsUrl(id)}>
        <span title={applicant}>
          {truncate(applicant as string, applicantTruncateLen)}
        </span>
      </TableLink>
    ),
  },
  {
    headerName: t("Application.headings.applicantType"),
    key: "type",
  },
  {
    headerName: t("Application.headings.unit"),
    key: "unitsSort",
    transform: ({ units }: ApplicationView) => {
      const allUnits = units.map((u) => u.nameFi).join(", ");

      return (
        <span title={allUnits}>
          {truncate(
            units
              .filter((u, i) => i < 2)
              .map((u) => u.nameFi)
              .join(", "),
            unitsTruncateLen
          )}
        </span>
      );
    },
  },
  {
    headerName: t("Application.headings.applicationCount"),
    key: "applicationCountSort",
    transform: ({ applicationCount }: ApplicationView) => applicationCount,
  },
  {
    headerName: t("Application.headings.phase"),
    key: "status",
    transform: ({ statusView }: ApplicationView) => statusView,
  },
];

const ApplicationsTable = ({
  sort,
  sortChanged: onSortChanged,
  applications,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const cols = memoize(() => getColConfig(t))();

  return (
    <>
      <DataOrMessage
        filteredData={applications}
        noFilteredData={t("ReservationUnits.noFilteredReservationUnits")}
      >
        <>
          <CustomTable
            setSort={onSortChanged}
            indexKey="pk"
            rows={applications}
            cols={cols}
            initialSortingColumnKey={
              sort === undefined ? undefined : sort.field
            }
            initialSortingOrder={
              sort === undefined ? undefined : (sort.sort && "asc") || "desc"
            }
          />
        </>
      </DataOrMessage>
    </>
  );
};

export default ApplicationsTable;
