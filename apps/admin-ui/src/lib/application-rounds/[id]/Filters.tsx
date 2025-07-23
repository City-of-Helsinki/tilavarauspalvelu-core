import React from "react";
import { useTranslation } from "next-i18next";
import { AutoGrid, HR } from "common/styled";
import { SearchTags } from "@/component/SearchTags";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import { AccessCodeState, ApplicationSectionStatusChoice, ReserveeType } from "@gql/gql-types";
import { MultiSelectFilter, SearchFilter } from "@/component/QueryParamFilters";
import { type TagOptionsList, translateTag } from "@/modules/search";

type OptionType = {
  value: number;
  label: string;
};

type Props = {
  unitGroupOptions: OptionType[];
  unitOptions: OptionType[];
  reservationUnitOptions?: OptionType[];
  statusOption?: "application" | "section" | "sectionShort";
  enableApplicant?: boolean;
  enableWeekday?: boolean;
  enableReservationUnit?: boolean;
  enableAccessCodeState?: boolean;
};

export function Filters({
  unitGroupOptions,
  unitOptions,
  reservationUnitOptions = [],
  statusOption = "application",
  enableApplicant = false,
  enableWeekday = false,
  enableReservationUnit = false,
  enableAccessCodeState = false,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const statusOptions = VALID_ALLOCATION_APPLICATION_STATUSES.map((status) => ({
    label: t(`application:statuses.${status}`),
    value: status,
  }));

  const applicantOptions = Object.values(ReserveeType).map((applicant) => ({
    label: t(`translation:reserveeType.${applicant}`),
    value: applicant,
  }));

  const accessCodeOptions = Object.values(AccessCodeState).map((s) => ({
    label: t(`accessType:accessCodeState.${s}`),
    value: s,
  }));

  const hideSearchTags: string[] = [
    "tab",
    "orderBy",
    ...(statusOption !== "application" ? ["status"] : ["sectionStatus"]),
    ...(!enableWeekday ? ["weekday"] : []),
    ...(!enableReservationUnit ? ["reservationUnit"] : []),
  ];

  const weekdayOptions = Array.from(Array(7)).map((_, i) => ({
    label: t(`translation:dayLong.${i}`),
    value: i,
  }));

  // section status is shared on two tabs, but allocated only has two options
  const sectionStatusArrayLong = Object.values(ApplicationSectionStatusChoice);
  // TODO these are "declined" / "approved" but the decline functionality is not implemented
  // so disabling the filter for now (there is no backend filter for it nor can it be tested)

  const sectionStatusOptions = (statusOption === "sectionShort" ? [] : sectionStatusArrayLong).map((status) => ({
    label: t(`translation:ApplicationSectionStatusChoice.${status}`),
    value: status,
  }));

  const options: TagOptionsList = {
    reservationUnits: reservationUnitOptions,
    units: unitOptions,
    unitGroups: unitGroupOptions,
    // Not needed on this page
    orderChoices: [],
    priorityChoices: [],
    reservationUnitStates: [],
    reservationUnitTypes: [],
    stateChoices: [],
    equipments: [],
    purposes: [],
    ageGroups: [],
    municipalities: [],
  };

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
      <SearchTags hide={hideSearchTags} translateTag={translateTag(t, options)} />
      <HR />
    </>
  );
}
