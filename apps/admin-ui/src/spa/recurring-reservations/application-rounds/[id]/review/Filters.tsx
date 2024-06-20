import React from "react";
import { useTranslation } from "react-i18next";
import { AutoGrid, FullRow } from "@/styles/layout";
import { SearchTags } from "@/component/SearchTags";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import {
  ApplicantTypeChoice,
  ApplicationSectionStatusChoice,
} from "@gql/gql-types";
import { HR } from "@/component/Table";
import { MultiSelectFilter, SearchFilter } from "@/component/QueryParamFilters";

type UnitPkName = {
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
        return t(`ApplicationSectionStatusChoice.${value}`);
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
  const eventStatusArrayLong = Object.values(ApplicationSectionStatusChoice);
  // TODO these are "declined" / "approved" but the decline functionality is not implemented
  // so disabling the filter for now (there is no backend filter for it nor can it be tested)

  const eventStatusOptions = (
    statusOption === "eventShort" ? [] : eventStatusArrayLong
  ).map((status) => ({
    label: t(`ApplicationSectionStatusChoice.${status}`),
    value: status,
  }));

  return (
    <AutoGrid>
      <MultiSelectFilter name="unit" options={unitOptions} />
      {statusOption !== "application" ? (
        eventStatusOptions.length > 0 ? (
          <MultiSelectFilter name="eventStatus" options={eventStatusOptions} />
        ) : null
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
