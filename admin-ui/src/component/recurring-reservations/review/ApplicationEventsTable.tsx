import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { memoize } from "lodash";
import { publicUrl } from "app/common/const";
import { CustomTable, DataOrMessage } from "../../lists/components";

import { ApplicationEventView, truncate } from "../util";
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
  applicationEvents: ApplicationEventView[];
};

const A = styled.a`
  color: var(--color-black);
`;

const getColConfig = (t: TFunction) => [
  {
    headerName: t("ApplicationEvent.headings.id"),
    isSortable: true,
    key: "id",
    transform: ({ id }: ApplicationEventView) => String(id),
  },
  {
    headerName: t("ApplicationEvent.headings.customer"),
    isSortable: true,
    key: "applicant",
    transform: ({ applicant, applicationId, id }: ApplicationEventView) => (
      <A
        href={`${publicUrl}${applicationDetailsUrl(applicationId)}#${id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span title={applicant}>
          {truncate(applicant ?? "-", applicantTruncateLen)}
        </span>
      </A>
    ),
  },
  {
    headerName: t("ApplicationEvent.headings.name"),
    key: "name",
  },
  {
    headerName: t("ApplicationEvent.headings.unit"),
    key: "units",
    transform: ({ units }: ApplicationEventView) => {
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
    headerName: t("ApplicationEvent.headings.stats"),
    key: "applicationCount",
    transform: ({ applicationCount }: ApplicationEventView) => applicationCount,
  },
  {
    headerName: t("ApplicationEvent.headings.phase"),
    key: "status",
    transform: ({ statusView }: ApplicationEventView) => statusView,
  },
];

const ApplicationEventsTable = ({
  sort,
  sortChanged: onSortChanged,
  applicationEvents,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const cols = memoize(() => getColConfig(t))();

  return (
    <DataOrMessage
      filteredData={applicationEvents}
      noFilteredData={t("ReservationUnits.noFilteredReservationUnits")}
    >
      <CustomTable
        setSort={onSortChanged}
        indexKey="pk"
        rows={applicationEvents}
        cols={cols}
        initialSortingColumnKey={sort === undefined ? undefined : sort.field}
        initialSortingOrder={
          sort === undefined ? undefined : (sort.sort && "asc") || "desc"
        }
      />
    </DataOrMessage>
  );
};

export default ApplicationEventsTable;
