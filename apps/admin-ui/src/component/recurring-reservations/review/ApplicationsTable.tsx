import React from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { memoize } from "lodash";
import { IconLinkExternal } from "hds-react";
import { publicUrl } from "app/common/const";
import {
  CustomTable,
  DataOrMessage,
  ExternalTableLink,
} from "../../lists/components";
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
    headerName: t("Application.headings.id"),
    isSortable: true,
    key: "id",
    transform: ({ id }: ApplicationView) => String(id),
  },
  {
    headerName: t("Application.headings.customer"),
    isSortable: true,
    key: "applicant",
    transform: ({ applicant, id }: ApplicationView) => (
      <ExternalTableLink
        href={`${publicUrl}${applicationDetailsUrl(id)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {truncate(applicant ?? "-", applicantTruncateLen)}
        <IconLinkExternal size="xs" aria-hidden />
      </ExternalTableLink>
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
              .filter((_, i) => i < 2)
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
    <DataOrMessage
      filteredData={applications}
      noFilteredData={t("ReservationUnits.noFilteredReservationUnits")}
    >
      <CustomTable
        setSort={onSortChanged}
        indexKey="pk"
        rows={applications}
        cols={cols}
        initialSortingColumnKey={sort === undefined ? undefined : sort.field}
        initialSortingOrder={
          sort === undefined ? undefined : (sort.sort && "asc") || "desc"
        }
      />
    </DataOrMessage>
  );
};

export default ApplicationsTable;
