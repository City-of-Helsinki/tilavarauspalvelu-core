import React from "react";
import { useTranslation } from "next-i18next";
import { AutoGrid, HR } from "common/styled";
import { SearchTags } from "@/component/SearchTags";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import { AccessCodeState, ApplicationSectionStatusChoice, ApplicationStatusChoice, ReserveeType } from "@gql/gql-types";
import { ControlledMultiSelectFilter, ControlledSearchFilter } from "@/component/QueryParamFilters";
import { type TagOptionsList, translateTag } from "@/modules/search";
import { useForm } from "react-hook-form";
import { DayT } from "common/src/const";
import { SearchButton, SearchButtonContainer } from "@/component/SearchButton";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { mapFormToSearchParams } from "common/src/modules/search";

interface FilterProps {
  options: TagOptionsList;
  statusOption?: "application" | "section" | "sectionShort";
  enableApplicant?: boolean;
  enableWeekday?: boolean;
  enableReservationUnit?: boolean;
  enableAccessCodeState?: boolean;
}

type SearchFormValues = {
  unitGroup: number[];
  unit: number[];
  sectionStatus: ApplicationSectionStatusChoice[];
  status: ApplicationStatusChoice[];
  reservationUnit: number[];
  applicant: ReserveeType[];
  weekday: DayT[];
  accessCodeState: AccessCodeState[];
  search: string;
};

export function Filters({
  options,
  statusOption = "application",
  enableApplicant = false,
  enableWeekday = false,
  enableReservationUnit = false,
  enableAccessCodeState = false,
}: FilterProps): JSX.Element {
  const { t } = useTranslation();

  const setSearchParams = useSetSearchParams();
  const form = useForm<SearchFormValues>({
    defaultValues: {
      search: "",
      unitGroup: [],
      unit: [],
      sectionStatus: [],
      status: [],
      reservationUnit: [],
      applicant: [],
      weekday: [],
      accessCodeState: [],
    },
  });

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

  // FIXME this probably doesn't work (and the above thing should be removed)
  const sectionStatusOptions = (statusOption === "sectionShort" ? [] : sectionStatusArrayLong).map((status) => ({
    label: t(`translation:ApplicationSectionStatusChoice.${status}`),
    value: status,
  }));

  const { handleSubmit, control } = form;
  const onSubmit = (data: SearchFormValues) => {
    setSearchParams(mapFormToSearchParams(data));
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <AutoGrid>
        <ControlledMultiSelectFilter control={control} name="unitGroup" options={options.unitGroups} />
        <ControlledMultiSelectFilter control={control} name="unit" options={options.units} />
        {statusOption !== "application" ? (
          sectionStatusOptions.length > 0 ? (
            <ControlledMultiSelectFilter control={control} name="sectionStatus" options={sectionStatusOptions} />
          ) : null
        ) : (
          <ControlledMultiSelectFilter control={control} name="status" options={statusOptions} />
        )}

        {enableReservationUnit && (
          <ControlledMultiSelectFilter control={control} name="reservationUnit" options={options.reservationUnits} />
        )}
        {enableApplicant && (
          <ControlledMultiSelectFilter control={control} name="applicant" options={applicantOptions} />
        )}
        {enableWeekday && <ControlledMultiSelectFilter control={control} name="weekday" options={weekdayOptions} />}
        {enableAccessCodeState && (
          <ControlledMultiSelectFilter control={control} name="accessCodeState" options={accessCodeOptions} />
        )}
        <ControlledSearchFilter control={control} name="search" />
      </AutoGrid>
      <SearchButtonContainer>
        <SearchTags hide={hideSearchTags} translateTag={translateTag(t, options)} />
        <SearchButton />
      </SearchButtonContainer>
      <HR />
    </form>
  );
}
