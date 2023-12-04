import React, { useEffect } from "react";
import { useQuery } from "@apollo/client";
import { Combobox, SearchInput, Select, Tabs } from "hds-react";
import { useTranslation } from "react-i18next";
import { debounce, uniqBy } from "lodash";
import { useParams, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { H1, fontBold, fontMedium } from "common/src/common/typography";
import { ShowAllContainer } from "common/src/components";
import {
  type Query,
  type ReservationUnitByPkType,
  type QueryApplicationEventsArgs,
  type UnitType,
  type QueryApplicationsArgs,
  ApplicantTypeChoice,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { SearchTags } from "@/component/SearchTags";
import Loader from "@/component/Loader";
import BreadcrumbWrapper from "@/component/BreadcrumbWrapper";
import { useOptions } from "@/component/my-units/hooks";
import { Container } from "@/styles/layout";
import { useNotification } from "@/context/NotificationContext";
import { useAllocationContext } from "@/context/AllocationContext";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import usePermission from "@/hooks/usePermission";
import { Permission } from "@/modules/permissionHelper";
import {
  ALL_EVENTS_PER_UNIT_QUERY,
  APPLICATION_EVENTS_FOR_ALLOCATION,
  MINIMAL_APPLICATION_QUERY,
} from "../queries";
import { ApplicationEvents } from "./ApplicationEvents";

type IParams = {
  applicationRoundId: string;
};

const StyledH1 = styled(H1).attrs({ $legacy: true })`
  margin: 0;
`;
const Ingress = styled.p`
  font-size: var(--fontsize-body-xl);
  margin: 0;
`;

const TabList = styled(Tabs.TabList)`
  ${fontMedium};
`;

const Tab = styled(Tabs.Tab)`
  && > span:before {
    z-index: 1;
  }
`;

const NumberOfResultsContainer = styled.div`
  --color-focus-outline: #0072c6;
  display: flex;
  gap: var(--spacing-s);
  & button {
    border: none;
    text-decoration: underline;
    background-color: transparent;
    &:hover {
      cursor: pointer;
    }
    &:focus {
      outline: none;
      box-shadow: 0 0 0 3px var(--color-focus-outline);
      transition: box-shadow 0.4s ease-in-out;
    }
  }
`;
const NumberOfResults = styled.span`
  ${fontBold}
`;

const transformApplicantType = (value: string | null) => {
  if (value == null) {
    return null;
  }
  switch (value) {
    case "Individual":
      return ApplicantTypeChoice.Individual;
    case "Community":
      return ApplicantTypeChoice.Community;
    case "Association":
      return ApplicantTypeChoice.Association;
    case "Company":
      return ApplicantTypeChoice.Company;
  }
  return null;
};

// TODO make the grid thing into AutoGridCss that can be imported
const MoreWrapper = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    color: var(--color-bus);
  }
  .ShowAllContainer__Content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    align-items: baseline;
    gap: var(--spacing-m);
  }
`;

type TimeFilterOptions = { label: string; value: 200 | 300 };

function ApplicationRoundAllocation({
  applicationRoundId,
  units,
  reservationUnits,
  roundName,
}: {
  applicationRoundId: number;
  units: UnitType[];
  reservationUnits: ReservationUnitByPkType[];
  roundName: string;
}): JSX.Element {
  const { refreshApplicationEvents, setRefreshApplicationEvents } =
    useAllocationContext();
  const { notifyError } = useNotification();

  const { t } = useTranslation();

  const customerFilterOptions = Object.keys(ApplicantTypeChoice).map(
    (value) => ({
      label: t(`Application.applicantTypes.${value.toUpperCase()}`),
      value: value as ApplicantTypeChoice,
    })
  );

  const options = useOptions();
  const purposeOptions = options.purpose;
  const cityOptions = options.homeCity;
  const ageGroupOptions = options.ageGroup;

  const [searchParams, setParams] = useSearchParams();

  const unitFilter = searchParams.get("unit");
  const setSingleValueSearchParam = (param: string, value: string | null) => {
    const vals = new URLSearchParams(searchParams);
    if (value == null) {
      vals.delete(param);
    } else {
      vals.set(param, value);
    }
    setParams(vals);
  };

  const setUnitFilter = (value: number) => {
    // NOTE different logic because values are not atomic and we need to set two params
    const vals = new URLSearchParams(searchParams);
    vals.set("unit", value.toString());
    // TODO how to find the default reservation unit for the selected unit?
    vals.delete("reservation-unit");
    setParams(vals);
  };

  // TODO if unit selection changes and new list doesn't include the selected reservation unit, clear the selection
  // TODO if the units change while we have an active filter but it doesn't match any of the new units, clear the filter
  useEffect(() => {
    if (units.length > 0 && unitFilter == null) {
      setUnitFilter(units[0].pk ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this is the correct list, but should be refactored
  }, [units]);

  const unitReservationUnits = reservationUnits.filter(
    (ru) => ru.unit?.pk != null && ru?.unit?.pk === Number(unitFilter)
  );

  // TODO default value here instead of the JSX
  // because otherwise we the query returns all the reservation units if the filter is not set
  const selectedReservationUnit =
    searchParams.get("reservation-unit") ??
    unitReservationUnits?.[0]?.pk?.toString() ??
    null;

  const setSelectedReservationUnit = (value: number | null) => {
    setSingleValueSearchParam("reservation-unit", value?.toString() ?? null);
  };

  const nameFilter = searchParams.get("name");
  const setNameFilter = (value: string) => {
    const vals = new URLSearchParams(searchParams);
    if (value === "") {
      vals.delete("name");
    } else {
      vals.set("name", value);
    }
    setParams(vals);
  };

  const setMultivalueSearchParam = (param: string, value: string[] | null) => {
    const vals = new URLSearchParams(searchParams);
    if (value == null || value.length === 0) {
      vals.delete(param);
    } else {
      vals.set(param, value[0]);
      value.forEach((v) => {
        if (!vals.has(param, v)) {
          vals.append(param, v);
        }
      });
    }
    setParams(vals);
  };

  const applicantTypeFilter = searchParams.getAll("applicantType");
  const setApplicantType = (value: ApplicantTypeChoice[] | null) => {
    setMultivalueSearchParam(
      "applicantType",
      value?.map((v) => v.toString()) ?? null
    );
  };

  const timeFilter = searchParams.getAll("time");
  const setTimeFilter = (value: TimeFilterOptions["value"][] | null) => {
    setMultivalueSearchParam("time", value?.map((v) => v.toString()) ?? null);
  };

  const orderFilter = searchParams.getAll("order");
  const setOrderFilter = (value: number[] | null) => {
    setMultivalueSearchParam("order", value?.map((v) => v.toString()) ?? null);
  };

  const ageGroupFilter = searchParams.getAll("ageGroup");
  const setAgeGroupFilter = (value: number[] | null) => {
    setMultivalueSearchParam(
      "ageGroup",
      value?.map((v) => v.toString()) ?? null
    );
  };

  const cityFilter = searchParams.getAll("city");
  const setCityFilter = (value: number[] | null) => {
    setMultivalueSearchParam("city", value?.map((v) => v.toString()) ?? null);
  };

  const purposeFilter = searchParams.getAll("purpose");
  const setPurposeFilter = (value: number[] | null) => {
    setMultivalueSearchParam(
      "purpose",
      value?.map((v) => v.toString()) ?? null
    );
  };

  const { data, refetch } = useQuery<Query, QueryApplicationEventsArgs>(
    APPLICATION_EVENTS_FOR_ALLOCATION,
    {
      skip: !applicationRoundId,
      // NOTE required otherwise this returns stale data when filters change
      fetchPolicy: "cache-and-network",
      variables: {
        applicationRound: applicationRoundId,
        ...(unitFilter != null ? { unit: [Number(unitFilter)] } : {}),
        ...(timeFilter != null
          ? {
              priority: timeFilter
                .map((x) => Number(x))
                .reduce<number[]>(
                  (acc, x) => (x === 200 ? [...acc, 200, 100] : [...acc, x]),
                  []
                ),
            }
          : {}),
        ...(orderFilter != null &&
        orderFilter.filter((x) => Number(x) <= 10).length > 0
          ? {
              preferredOrder: orderFilter
                .map((x) => Number(x))
                .filter((x) => x <= 10),
            }
          : {}),
        includePreferredOrder10OrHigher:
          orderFilter != null &&
          orderFilter.filter((x) => Number(x) > 10).length > 0,
        ...(nameFilter != null ? { textSearch: nameFilter } : {}),
        ...(cityFilter != null
          ? { homeCity: cityFilter.map((x) => Number(x)) }
          : {}),
        ...(applicantTypeFilter != null
          ? {
              applicantType: applicantTypeFilter.map((x) =>
                transformApplicantType(x)
              ),
            }
          : {}),
        ...(purposeFilter != null
          ? { purpose: purposeFilter.map((x) => Number(x)) }
          : {}),
        ...(ageGroupFilter != null
          ? { ageGroup: [Number(ageGroupFilter)] }
          : {}),
        reservationUnit:
          selectedReservationUnit != null
            ? [Number(selectedReservationUnit)]
            : [],
        applicationStatus: VALID_ALLOCATION_APPLICATION_STATUSES,
      },
      onError: () => {
        notifyError(t("errors.errorFetchingData"));
      },
    }
  );

  // TODO this can be combined with the above query (but requires casting the alias)
  const { data: allEventsData } = useQuery<Query, QueryApplicationEventsArgs>(
    ALL_EVENTS_PER_UNIT_QUERY,
    {
      skip: !applicationRoundId || !selectedReservationUnit || !unitFilter,
      variables: {
        applicationRound: applicationRoundId,
        // cast constructor is ok because of the skip
        reservationUnit: [Number(selectedReservationUnit)],
        unit: [Number(unitFilter)],
        applicationStatus: VALID_ALLOCATION_APPLICATION_STATUSES,
      },
    }
  );
  const allEvents = filterNonNullable(
    allEventsData?.applicationEvents?.edges.map((e) => e?.node)
  );
  const totalNumberOfEvents = allEvents.length;

  // NOTE rather sketchy: this is the context event listener
  useEffect(() => {
    if (refreshApplicationEvents) {
      refetch();
      setRefreshApplicationEvents(false);
    }
  }, [refetch, refreshApplicationEvents, setRefreshApplicationEvents]);

  const applicationEvents = filterNonNullable(
    data?.applicationEvents?.edges.map((e) => e?.node)
  );

  const unitOptions = units.map((unit) => ({
    value: unit.pk ?? 0,
    label: unit.nameFi ?? "",
  }));

  const timeOptions = ([300, 200] as const).map((n) => ({
    value: n,
    label: t(`ApplicationEvent.priority.${n}`),
  }));

  const orderOptions = Array.from(Array(10).keys())
    .map((n) => ({
      value: n + 1,
      label: `${n + 1}. ${t("Allocation.filters.reservationUnitApplication")}`,
    }))
    .concat([
      {
        value: 11,
        label: `${t("Allocation.filters.reservationUnitApplicationOthers")}`,
      },
    ]);

  const translateTag = (key: string, value: string) => {
    switch (key) {
      case "city":
        return cityOptions.find((o) => String(o.value) === value)?.label ?? "";
      case "textSearch":
        return value;
      case "applicantType":
        return t(`Application.applicantTypes.${value.toUpperCase()}`);
      case "purpose":
        return (
          purposeOptions.find((o) => String(o.value) === value)?.label ?? ""
        );
      case "ageGroup":
        return (
          ageGroupOptions.find((o) => String(o.value) === value)?.label ?? ""
        );
      case "time":
        return timeOptions.find((o) => String(o.value) === value)?.label ?? "";
      case "order":
        return orderOptions.find((o) => String(o.value) === value)?.label ?? "";
      case "name":
        return value;
      default:
        return key;
    }
  };

  const hideSearchTags = ["unit", "reservation-unit"];

  const handleResetFilters = () => {
    const newParams = hideSearchTags.reduce<typeof searchParams>(
      (acc, s) =>
        searchParams.get(s) ? { ...acc, [s]: searchParams.get(s) } : acc,
      new URLSearchParams()
    );
    setParams(newParams);
  };

  // NOTE findIndex returns -1 if not found
  const initiallyActiveTab = unitReservationUnits.findIndex(
    (x) => x.pk != null && x.pk.toString() === selectedReservationUnit
  );

  return (
    // TODO top gap is 2rem but the rest of the page is something else so can't change the container directly
    <Container>
      {/* TODO these look like they have wrong margins */}
      <div>
        <StyledH1>{t("Allocation.allocationTitle")}</StyledH1>
        <Ingress>{roundName}</Ingress>
      </div>
      <MoreWrapper
        showAllLabel={t("ReservationUnitsSearch.moreFilters")}
        showLessLabel={t("ReservationUnitsSearch.lessFilters")}
        maximumNumber={4}
      >
        <Select
          label={t("Allocation.filters.label.unit")}
          options={unitOptions}
          disabled={unitOptions.length === 0}
          value={
            unitOptions.find((v) => v.value === Number(unitFilter)) ?? null
          }
          onChange={(val: { label: string; value: number }) =>
            setUnitFilter(val.value ?? null)
          }
          placeholder={t("common.selectPlaceholder")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <Combobox<typeof timeOptions>
          label={t("Allocation.filters.label.schedules")}
          clearable
          multiselect
          /* @ts-expect-error - multiselect issues */
          options={timeOptions}
          disabled={timeOptions.length === 0}
          value={
            timeOptions.filter((v) =>
              timeFilter.includes(v.value.toString())
            ) ?? null
          }
          onChange={(val?: TimeFilterOptions[]) =>
            setTimeFilter(val?.map((x) => x.value) ?? null)
          }
          placeholder={t("Allocation.filters.placeholder.time")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <Combobox<typeof orderOptions>
          label={t("Allocation.filters.label.reservationUnitOrder")}
          clearable
          multiselect
          /* @ts-expect-error - multiselect issues */
          options={orderOptions}
          disabled={orderOptions.length === 0}
          value={
            orderOptions.filter((v) =>
              orderFilter.includes(v.value.toString())
            ) ?? null
          }
          onChange={(val?: typeof orderOptions) =>
            setOrderFilter(val?.map((x) => x.value) ?? null)
          }
          placeholder={t("Allocation.filters.placeholder.order")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <SearchInput
          label={t("Allocation.filters.label.search")}
          onChange={debounce((str) => setNameFilter(str), 100, {
            leading: true,
          })}
          onSubmit={() => {}}
          value={nameFilter ?? ""}
          placeholder={t("Allocation.filters.placeholder.search")}
        />
        <Combobox<typeof cityOptions>
          label={t("Allocation.filters.label.homeCity")}
          clearable
          multiselect
          /* @ts-expect-error - multiselect issues */
          options={cityOptions}
          disabled={cityOptions.length === 0}
          value={
            cityOptions.filter((v) =>
              cityFilter.includes(v.value.toString())
            ) ?? null
          }
          onChange={(val?: typeof cityOptions) =>
            setCityFilter(val?.map((x) => x.value) ?? null)
          }
          placeholder={t("Allocation.filters.placeholder.homeCity")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <Combobox<typeof customerFilterOptions>
          label={t("Allocation.filters.label.applicantType")}
          clearable
          multiselect
          /* @ts-expect-error - multiselect issues */
          options={customerFilterOptions}
          disabled={customerFilterOptions.length === 0}
          value={
            customerFilterOptions.filter((v) =>
              applicantTypeFilter.includes(v.value.toString())
            ) ?? null
          }
          onChange={(val?: typeof customerFilterOptions) =>
            setApplicantType(val?.map((x) => x.value) ?? null)
          }
          placeholder={t("Allocation.filters.placeholder.applicantType")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <Combobox<typeof ageGroupOptions>
          label={t("filters.ageGroup")}
          clearable
          multiselect
          /* @ts-expect-error - multiselect issues */
          options={ageGroupOptions}
          disabled={ageGroupOptions.length === 0}
          value={
            ageGroupOptions.filter((v) =>
              ageGroupFilter.includes(v.value.toString())
            ) ?? null
          }
          onChange={(val?: typeof ageGroupOptions) =>
            setAgeGroupFilter(val?.map((x) => x.value) ?? null)
          }
          placeholder={t("Allocation.filters.placeholder.ageGroup")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <Combobox<typeof purposeOptions>
          label={t("filters.purpose")}
          clearable
          multiselect
          /* @ts-expect-error - multiselect issues */
          options={purposeOptions}
          disabled={purposeOptions.length === 0}
          value={
            purposeOptions.filter((v) =>
              purposeFilter.includes(v.value.toString())
            ) ?? null
          }
          onChange={(val?: typeof purposeOptions) =>
            setPurposeFilter(val?.map((x) => x.value) ?? null)
          }
          placeholder={t("Allocation.filters.placeholder.purpose")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
      </MoreWrapper>
      <SearchTags hide={hideSearchTags} translateTag={translateTag} />
      {/* using a key here is a hack to force remounting the tabs
       * remount causes flickering but HDS doesn't allow programmatically changing the active tab
       */}
      <Tabs
        initiallyActiveTab={initiallyActiveTab >= 0 ? initiallyActiveTab : 0}
        key={unitFilter ?? "unit-none"}
      >
        <TabList>
          {unitReservationUnits.map((ru) => (
            <Tab
              onClick={() => setSelectedReservationUnit(ru.pk ?? null)}
              key={ru?.pk}
            >
              {ru?.nameFi}
            </Tab>
          ))}
        </TabList>
        {/* NOTE: we want the tabs as buttons, without this the HDS tabs break */}
        <Tabs.TabPanel />
      </Tabs>
      <NumberOfResultsContainer>
        {applicationEvents.length === totalNumberOfEvents ? (
          t("Allocation.countAllResults", { count: totalNumberOfEvents })
        ) : (
          <>
            <NumberOfResults>
              {applicationEvents.length} / {totalNumberOfEvents}
            </NumberOfResults>
            {t("Allocation.countResultsPostfix")}
            <button type="button" onClick={handleResetFilters}>
              {t("Allocation.clearFiltersButton")}
            </button>
          </>
        )}
      </NumberOfResultsContainer>
      <ApplicationEvents
        applicationEvents={applicationEvents}
        reservationUnit={
          unitReservationUnits.find(
            (x) => x.pk != null && x.pk.toString() === selectedReservationUnit
          ) || unitReservationUnits[0]
        }
      />
    </Container>
  );
}

// Do a single full query to get filter / page data
function AllocationWrapper({
  applicationRoundId,
}: {
  applicationRoundId: number;
}): JSX.Element {
  const { loading, error, data } = useQuery<Query, QueryApplicationsArgs>(
    MINIMAL_APPLICATION_QUERY,
    {
      skip: !applicationRoundId,
      variables: {
        applicationRound: applicationRoundId ?? 0,
        status: VALID_ALLOCATION_APPLICATION_STATUSES,
      },
    }
  );

  const { hasUnitPermission } = usePermission();

  // TODO don't use spinners, skeletons are better
  // also this blocks the sub component query (the initial with zero filters) which slows down the page load
  if (loading) {
    return <Loader />;
  }
  // TODO improve this (disabled filters if error, notify the user, but don't block the whole page)
  if (error) {
    return <p>Error</p>;
  }

  const applications = filterNonNullable(
    data?.applications?.edges?.map((edge) => edge?.node)
  );

  const reservationUnits = applications
    .flatMap((a) => a.applicationEvents)
    .flatMap((ae) =>
      ae?.eventReservationUnits?.flatMap((eru) => eru?.reservationUnit)
    );
  const unitData = reservationUnits.map((ru) => ru?.unit);

  // TODO sort by name (they are in a random order because of the nested structure)
  const units = uniqBy(filterNonNullable(unitData), "pk")
    .filter((unit) =>
      hasUnitPermission(Permission.CAN_VALIDATE_APPLICATIONS, unit)
    )
    .sort((a, b) => a?.nameFi?.localeCompare(b?.nameFi ?? "") ?? 0);

  const roundName = applications?.[0]?.applicationRound?.nameFi ?? "";

  const resUnits = uniqBy(filterNonNullable(reservationUnits), "pk").sort(
    (a, b) => a?.nameFi?.localeCompare(b?.nameFi ?? "") ?? 0
  );
  return (
    <>
      <BreadcrumbWrapper backLink=".." />
      <ApplicationRoundAllocation
        applicationRoundId={applicationRoundId}
        units={units}
        reservationUnits={resUnits}
        roundName={roundName}
      />
    </>
  );
}

function ApplicationRoundAllocationRouted(): JSX.Element {
  const { applicationRoundId } = useParams<IParams>();
  const { t } = useTranslation();

  if (!applicationRoundId || Number.isNaN(Number(applicationRoundId))) {
    return <div>{t("errors.router.invalidApplicationRoundNumber")}</div>;
  }
  return <AllocationWrapper applicationRoundId={Number(applicationRoundId)} />;
}

export default ApplicationRoundAllocationRouted;
