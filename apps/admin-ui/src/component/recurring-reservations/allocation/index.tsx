import React, { useEffect } from "react";
import { gql, useQuery } from "@apollo/client";
import { Select, Tabs, TextInput } from "hds-react";
import { useTranslation } from "react-i18next";
import { uniqBy } from "lodash";
import { useParams, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { H1, Strongish } from "common/src/common/typography";
import { ShowAllContainer } from "common/src/components";
import {
  type Query,
  ApplicationStatusChoice,
  type ReservationUnitByPkType,
  type QueryApplicationEventsArgs,
  type UnitType,
  type QueryApplicationsArgs,
  ApplicantTypeChoice,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { SearchTags } from "app/component/SearchTags";
import { Container } from "@/styles/layout";
import { useNotification } from "@/context/NotificationContext";
import { useAllocationContext } from "@/context/AllocationContext";
import Loader from "@/component/Loader";
import LinkPrev from "@/component/LinkPrev";
import usePermission from "@/hooks/usePermission";
import { Permission } from "@/modules/permissionHelper";
import { APPLICATION_EVENTS_FOR_ALLOCATION } from "../queries";
import { ApplicationEvents } from "./ApplicationEvents";
import { useOptions } from "@/component/my-units/hooks";

const ALLOCATION_APPLICATION_STATUSES = [
  ApplicationStatusChoice.Received,
  ApplicationStatusChoice.Handled,
  ApplicationStatusChoice.ResultsSent,
  ApplicationStatusChoice.InAllocation,
];

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
  ${Strongish};
`;

const Tab = styled(Tabs.Tab)`
  && > span:before {
    z-index: 1;
  }
`;

// Separate minimal query to find all possible values for filters
const APPLICATION_ROUND_QUERY = gql`
  query Applications(
    $applicationRound: Int!
    $status: [ApplicationStatusChoice]!
  ) {
    applications(applicationRound: $applicationRound, status: $status) {
      edges {
        node {
          applicationRound {
            nameFi
          }
          applicationEvents {
            eventReservationUnits {
              reservationUnit {
                pk
                nameFi
                unit {
                  pk
                  nameFi
                }
              }
            }
          }
        }
      }
    }
  }
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

  // TODO default value here instead of the JSX
  const selectedReservationUnit = searchParams.get("reservation-unit");
  const setSelectedReservationUnit = (value: number | null) => {
    // TODO this conflicts with the setUnitFilter
    // should be fine to enable if they are never called from same event handler
    // eslint-disable-next-line no-console -- TODO
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
      // TODO this doesn't remove a value if there are more than one value
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

  // TODO pagination
  const { data, refetch } = useQuery<Query, QueryApplicationEventsArgs>(
    APPLICATION_EVENTS_FOR_ALLOCATION,
    {
      skip: !applicationRoundId,
      // NOTE required otherwise this returns stale data when filters change
      fetchPolicy: "cache-and-network",
      variables: {
        applicationRound: applicationRoundId,
        ...(unitFilter != null ? { unit: [Number(unitFilter)] } : {}),
        // TODO timeFilter in null state should show nothing
        ...(timeFilter != null
          ? { priority: timeFilter.map((x) => Number(x)) }
          : {}),
        // TODO how to do a negative query here? we want everything over 10
        // it's includePreferredOrder10OrHigher boolean filter in the query
        ...(orderFilter != null
          ? { preferredOrder: orderFilter.map((x) => Number(x)) }
          : {}),
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
        /* TODO what is the status we are looking for here? event status
         * or do we want to use applicationStatus instead */
        applicationStatus: ALLOCATION_APPLICATION_STATUSES,
      },
      onError: () => {
        notifyError(t("errors.errorFetchingData"));
      },
    }
  );

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
      default:
        return key;
    }
  };

  const tabResUnits = reservationUnits.filter(
    (ru) => ru.unit?.pk != null && ru?.unit?.pk === Number(unitFilter)
  );

  // TODO replace with Combobox over Select
  // TODO show the total number and the filtered number of application events
  return (
    // TODO top gap is 2rem but the rest of the page is something else so can't change the container directly
    <Container>
      {/* TODO this can't be prev link because it uses history.pop not history('..')
          so it doesn't work with search params properly
          TODO it also has wrong margins (compared to other pages)
      */}
      <LinkPrev />
      {/* TODO these look like they have wrong margins */}
      <div>
        <StyledH1>{t("Allocation.allocationTitle")}</StyledH1>
        <Ingress>{roundName}</Ingress>
      </div>
      {/* TODO abstract this to a component? and use the query params to save the state instead of useState */}
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
        {/* TODO is this multi select or just no select is all? */}
        <Select
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
        <Select
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
        {/* TODO debounce this before updates */}
        <TextInput
          id="search"
          label={t("Allocation.filters.label.search")}
          onChange={(e) => setNameFilter(e.target.value)}
          value={nameFilter ?? ""}
          placeholder={t("Allocation.filters.placeholder.search")}
        />
        <Select
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
        <Select
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
        <Select
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
        <Select
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
      <SearchTags
        hide={["unit", "reservation-unit"]}
        translateTag={translateTag}
      />
      <Tabs
        initiallyActiveTab={
          tabResUnits.findIndex(
            (x) => x.pk != null && x.pk.toString() === selectedReservationUnit
          ) ?? 0
        }
      >
        <TabList>
          {/* TODO check if this is correct, it changed from two tabs to one after the filter change
           * it did improve the usability though (loading state), or it seems like
           */}
          {tabResUnits.map((reservationUnit) => (
            <Tab
              onClick={() =>
                setSelectedReservationUnit(reservationUnit.pk ?? null)
              }
              key={reservationUnit?.pk}
            >
              {reservationUnit?.nameFi}
            </Tab>
          ))}
        </TabList>
        {/* NOTE: we want the tabs as buttons, without this the HDS tabs break */}
        <Tabs.TabPanel />
      </Tabs>
      <ApplicationEvents
        applicationEvents={applicationEvents}
        reservationUnit={
          tabResUnits.find(
            (x) => x.pk != null && x.pk.toString() === selectedReservationUnit
          ) || reservationUnits[0]
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
    APPLICATION_ROUND_QUERY,
    {
      skip: !applicationRoundId,
      variables: {
        applicationRound: applicationRoundId ?? 0,
        status: ALLOCATION_APPLICATION_STATUSES,
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
  const units = uniqBy(filterNonNullable(unitData), "pk").filter((unit) =>
    hasUnitPermission(Permission.CAN_VALIDATE_APPLICATIONS, unit)
  );

  const roundName = applications?.[0]?.applicationRound?.nameFi ?? "";

  const resUnits = uniqBy(filterNonNullable(reservationUnits), "pk");
  return (
    <ApplicationRoundAllocation
      applicationRoundId={applicationRoundId}
      units={units}
      reservationUnits={resUnits}
      roundName={roundName}
    />
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
