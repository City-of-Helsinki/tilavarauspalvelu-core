import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { SearchButton, SearchButtonContainer } from "ui/src/components/SearchButton";
import { DayT } from "ui/src/modules/const";
import { convertWeekday } from "ui/src/modules/conversion";
import { mapFormToSearchParams } from "ui/src/modules/search";
import { AutoGrid, Flex, HR } from "ui/src/styled";
import { ControlledMultiSelectFilter, ControlledSearchFilter } from "@/components/QueryParamFilters";
import { SearchTags } from "@/components/SearchTags";
import { getFilterSearchParams } from "@/hooks/useGetFilterSearchParams";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "@/modules/const";
import { translateTag } from "@/modules/search";
import type { TagOptionsList } from "@/modules/search";
import { AccessCodeState, ApplicationSectionStatusChoice, ApplicationStatusChoice, ReserveeType } from "@gql/gql-types";

interface FilterProps {
  options: TagOptionsList;
  statusOption?: "application" | "section";
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

function mapParamsToForm(params: ReadonlyURLSearchParams): SearchFormValues {
  const {
    unitGroupFilter,
    unitFilter,
    sectionStatusFilter,
    applicationStatusFilter,
    reservationUnitFilter,
    applicantTypeFilter,
    weekDayFilter,
    accessCodeStateFilter,
    textFilter,
  } = getFilterSearchParams({ searchParams: params });
  return {
    unitGroup: unitGroupFilter ?? [],
    unit: unitFilter ?? [],
    sectionStatus: sectionStatusFilter ?? [],
    status: applicationStatusFilter ?? [],
    reservationUnit: reservationUnitFilter ?? [],
    applicant: applicantTypeFilter ?? [],
    weekday: (weekDayFilter ?? []).map(convertWeekday),
    accessCodeState: accessCodeStateFilter ?? [],
    search: textFilter ?? "",
  };
}

export function Filters({
  options,
  statusOption = "application",
  enableApplicant = false,
  enableWeekday = false,
  enableReservationUnit = false,
  enableAccessCodeState = false,
}: FilterProps): JSX.Element {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const setSearchParams = useSetSearchParams();

  const defaultValues = mapParamsToForm(searchParams);
  const form = useForm<SearchFormValues>({
    defaultValues,
  });

  const { handleSubmit, control, reset } = form;
  const onSubmit = (data: SearchFormValues) => {
    setSearchParams(mapFormToSearchParams(data));
  };
  useEffect(() => {
    reset(mapParamsToForm(searchParams));
  }, [reset, searchParams]);

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

  const weekdayOptions = [...Array(7)].map((_, i) => ({
    label: t(`translation:dayLong.${i}`),
    value: i,
  }));

  const sectionStatusOptions = Object.values(ApplicationSectionStatusChoice).map((status) => ({
    label: t(`translation:ApplicationSectionStatusChoice.${status}`),
    value: status,
  }));

  const hideSearchTags: string[] = [
    "tab",
    "orderBy",
    ...(statusOption !== "application" ? ["status"] : ["sectionStatus"]),
    ...(!enableWeekday ? ["weekday"] : []),
    ...(!enableReservationUnit ? ["reservationUnit"] : []),
  ];

  return (
    <Flex as="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <AutoGrid>
        <ControlledMultiSelectFilter control={control} name="unitGroup" options={options.unitGroups} />
        <ControlledMultiSelectFilter control={control} name="unit" options={options.units} enableSearch />
        {statusOption === "section" ? (
          <ControlledMultiSelectFilter control={control} name="sectionStatus" options={sectionStatusOptions} />
        ) : statusOption === "application" ? (
          <ControlledMultiSelectFilter control={control} name="status" options={statusOptions} />
        ) : null}

        {enableReservationUnit && (
          <ControlledMultiSelectFilter
            control={control}
            name="reservationUnit"
            options={options.reservationUnits}
            enableSearch
          />
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
    </Flex>
  );
}
