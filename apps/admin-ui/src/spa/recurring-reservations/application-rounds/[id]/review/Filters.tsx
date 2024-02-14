import React from "react";
import { useTranslation } from "react-i18next";
import { AutoGrid, FullRow } from "@/styles/layout";
import { SearchTags } from "@/component/SearchTags";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import {
  ApplicantTypeChoice,
  ApplicationEventStatusChoice,
} from "common/types/gql-types";
import { HR } from "@/component/Table";
import { MultiSelectFilter, SearchFilter } from "@/component/QueryParamFilters";

export type UnitPkName = {
  pk: number;
  nameFi: string;
};

type Props = {
  units: UnitPkName[];
  statusOption?: "application" | "event" | "eventShort";
  enableWeekday?: boolean;
  enableReservationUnit?: boolean;
  reservationUnits?: UnitPkName[];
};

export function Filters({
  units,
  statusOption = "application",
  enableWeekday = false,
  enableReservationUnit = false,
  reservationUnits = [],
}: Props): JSX.Element {
  const { t } = useTranslation();

  const unitOptions = units.map((unit) => ({
    label: unit?.nameFi ?? "",
    value: unit?.pk ?? "",
  }));

  const statusOptions = VALID_ALLOCATION_APPLICATION_STATUSES.map((status) => ({
    label: t(`Application.statuses.${status}`),
    value: status,
  }));

  const applicantOptions = Object.values(ApplicantTypeChoice).map(
    (applicant) => ({
      label: t(`Application.applicantTypes.${applicant}`),
      value: applicant,
    })
  );

  const translateTag = (key: string, value: string) => {
    switch (key) {
      case "unit":
        return unitOptions.find((u) => u.value === Number(value))?.label ?? "-";
      case "status":
        return t(`Application.statuses.${value}`);
      case "applicant":
        return t(`Application.applicantTypes.${value}`);
      case "weekday":
        return t(`dayLong.${value}`);
      case "reservationUnit":
        return (
          reservationUnits.find((u) => u.pk === Number(value))?.nameFi ?? "-"
        );
      case "eventStatus":
        return t(`ApplicationEvent.statuses.${value}`);
      default:
        return value;
    }
  };

  const hideSearchTags: string[] = [
    "tab",
    "orderBy",
    ...(statusOption !== "application" ? ["status"] : ["eventStatus"]),
    ...(!enableWeekday ? ["weekday"] : []),
    ...(!enableReservationUnit ? ["reservationUnit"] : []),
  ];

  const weekdayOptions = Array.from(Array(7)).map((_, i) => ({
    label: t(`dayLong.${i}`),
    value: i,
  }));

  const reservationUnitOptions = reservationUnits.map((unit) => ({
    label: unit?.nameFi ?? "",
    value: unit?.pk ?? "",
  }));

  // event status is shared on two tabs, but allocated only has two options
  const eventStatusArrayLong = Object.values(
    ApplicationEventStatusChoice
  ).filter((x) => x !== ApplicationEventStatusChoice.Failed);
  const eventStatusArrayShort = [
    ApplicationEventStatusChoice.Approved,
    ApplicationEventStatusChoice.Declined,
  ];
  const eventStatusOptions = (
    statusOption === "eventShort" ? eventStatusArrayShort : eventStatusArrayLong
  ).map((status) => ({
    label: t(`ApplicationEvent.statuses.${status}`),
    value: status,
  }));

  return (
    <AutoGrid>
      <MultiSelectFilter name="unit" options={unitOptions} />
      {statusOption !== "application" ? (
        <MultiSelectFilter name="eventStatus" options={eventStatusOptions} />
      ) : (
        <MultiSelectFilter name="status" options={statusOptions} />
      )}
      <MultiSelectFilter name="applicant" options={applicantOptions} />
      {enableWeekday && (
        <MultiSelectFilter name="weekday" options={weekdayOptions} />
      )}
      {enableReservationUnit && (
        <MultiSelectFilter
          name="reservationUnit"
          options={reservationUnitOptions}
        />
      )}
      <SearchFilter name="search" />
      <FullRow>
        <SearchTags hide={hideSearchTags} translateTag={translateTag} />
      </FullRow>
      <FullRow>
        <HR />
      </FullRow>
    </AutoGrid>
  );
}
