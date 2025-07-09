import React from "react";
import { useTranslation } from "react-i18next";
import { AutoGrid, HR } from "common/styled";
import { SearchTags } from "@/component/SearchTags";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import { AccessCodeState, ApplicationSectionStatusChoice, ReserveeType } from "@gql/gql-types";
import { MultiSelectFilter, SearchFilter } from "@/component/QueryParamFilters";
import { useUnitGroupOptions } from "@/hooks/useUnitGroupOptions";

type UnitPkName = {
  pk: number;
  nameFi: string;
};

type Props = {
  units: UnitPkName[];
  statusOption?: "application" | "section" | "sectionShort";
  enableApplicant?: boolean;
  enableWeekday?: boolean;
  enableReservationUnit?: boolean;
  reservationUnits?: UnitPkName[];
  enableAccessCodeState?: boolean;
};

export function Filters({
  units,
  statusOption = "application",
  enableApplicant = false,
  enableWeekday = false,
  enableReservationUnit = false,
  reservationUnits = [],
  enableAccessCodeState = false,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const { options: unitGroupOptions } = useUnitGroupOptions();

  const unitOptions = units.map((unit) => ({
    label: unit?.nameFi ?? "",
    value: unit?.pk ?? "",
  }));

  const statusOptions = VALID_ALLOCATION_APPLICATION_STATUSES.map((status) => ({
    label: t(`Application.statuses.${status}`),
    value: status,
  }));

  const applicantOptions = Object.values(ReserveeType).map((applicant) => ({
    label: t(`Application.applicantTypes.${applicant}`),
    value: applicant,
  }));

  const accessCodeOptions = Object.values(AccessCodeState).map((s) => ({
    value: s,
    label: t(`accessType:accessCodeState.${s}`),
  }));

  const translateTag = (key: string, value: string) => {
    switch (key) {
      case "unitGroup":
        return unitGroupOptions.find((u) => u.value === Number(value))?.label ?? "-";
      case "unit":
        return unitOptions.find((u) => u.value === Number(value))?.label ?? "-";
      case "status":
        return t(`Application.statuses.${value}`);
      case "applicant":
        return t(`Application.applicantTypes.${value}`);
      case "weekday":
        return t(`dayLong.${value}`);
      case "reservationUnit":
        return reservationUnits.find((u) => u.pk === Number(value))?.nameFi ?? "-";
      case "sectionStatus":
        return t(`ApplicationSectionStatusChoice.${value}`);
      case "accessCodeState":
        return t(`accessType:accessCodeState.${value}`);
      default:
        return value;
    }
  };

  const hideSearchTags: string[] = [
    "tab",
    "orderBy",
    ...(statusOption !== "application" ? ["status"] : ["sectionStatus"]),
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

  // section status is shared on two tabs, but allocated only has two options
  const sectionStatusArrayLong = Object.values(ApplicationSectionStatusChoice);
  // TODO these are "declined" / "approved" but the decline functionality is not implemented
  // so disabling the filter for now (there is no backend filter for it nor can it be tested)

  const sectionStatusOptions = (statusOption === "sectionShort" ? [] : sectionStatusArrayLong).map((status) => ({
    label: t(`ApplicationSectionStatusChoice.${status}`),
    value: status,
  }));

  return (
    <>
      <AutoGrid>
        <MultiSelectFilter name="unitGroup" options={unitGroupOptions} />
        <MultiSelectFilter name="unit" options={unitOptions} />
        {statusOption !== "application" ? (
          sectionStatusOptions.length > 0 ? (
            <MultiSelectFilter name="sectionStatus" options={sectionStatusOptions} />
          ) : null
        ) : (
          <MultiSelectFilter name="status" options={statusOptions} />
        )}
        {enableReservationUnit && <MultiSelectFilter name="reservationUnit" options={reservationUnitOptions} />}
        {enableApplicant && <MultiSelectFilter name="applicant" options={applicantOptions} />}
        {enableWeekday && <MultiSelectFilter name="weekday" options={weekdayOptions} />}
        {enableAccessCodeState && <MultiSelectFilter name="accessCodeState" options={accessCodeOptions} />}
        <SearchFilter name="search" />
      </AutoGrid>
      <SearchTags hide={hideSearchTags} translateTag={translateTag} />
      <HR />
    </>
  );
}
