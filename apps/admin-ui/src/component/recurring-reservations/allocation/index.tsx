import React, { useEffect, useState } from "react";
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
  // TODO move this to search params
  const [selectedReservationUnit, setSelectedReservationUnit] =
    useState<ReservationUnitByPkType | null>(null);

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
  const setUnitFilter = (value: number | null) => {
    // TODO do we want to allow this?
    // no not really we want to allow reseting it to a default value
    // no the default value should not be in the url just in the code if it is not set
    const vals = new URLSearchParams(searchParams);
    if (value == null) {
      vals.delete("unit");
    } else {
      vals.set("unit", value.toString());
    }
    setParams(vals);
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

  const applicantTypeFilter = searchParams.get("applicantType");
  const setApplicantType = (value: ApplicantTypeChoice | null) => {
    const vals = new URLSearchParams(searchParams);
    if (value == null) {
      vals.delete("applicantType");
    } else {
      vals.set("applicantType", value.toString());
    }
    setParams(vals);
  };

  const timeFilter = searchParams.get("time");
  const setTimeFilter = (value: TimeFilterOptions["value"] | null) => {
    const vals = new URLSearchParams(searchParams);
    if (value == null) {
      vals.delete("time");
    } else {
      vals.set("time", value.toString());
    }
    setParams(vals);
  };

  const orderFilter = searchParams.get("order");
  const setOrderFilter = (value: number | null) => {
    const vals = new URLSearchParams(searchParams);
    if (value == null) {
      vals.delete("order");
    } else {
      vals.set("order", value.toString());
    }
    setParams(vals);
  };

  // pk filters
  const ageGroupFilter = searchParams.get("ageGroup");
  const setAgeGroupFilter = (value: number | null) => {
    const vals = new URLSearchParams(searchParams);
    if (value == null) {
      vals.delete("ageGroup");
    } else {
      vals.set("ageGroup", value.toString());
    }
    setParams(vals);
  };

  const cityFilter = searchParams.get("city");
  const setCityFilter = (value: number | null) => {
    const vals = new URLSearchParams(searchParams);
    if (value == null) {
      vals.delete("city");
    } else {
      vals.set("city", value.toString());
    }
    setParams(vals);
  };

  const purposeFilter = searchParams.get("purpose");
  const setPurposeFilter = (value: number | null) => {
    const vals = new URLSearchParams(searchParams);
    if (value == null) {
      vals.delete("purpose");
    } else {
      vals.set("purpose", value.toString());
    }
    setParams(vals);
  };

  // TODO filter values should be gotten from the base applicationRound (not calculated from the events, because the events
  // keep changing based on the filters, so we would always get smaller and smaller amount of options)
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
        ...(timeFilter != null ? { priority: [Number(timeFilter)] } : {}),
        ...(orderFilter != null
          ? { preferredOrder: [Number(orderFilter)] }
          : {}),
        ...(nameFilter != null ? { textSearch: nameFilter } : {}),
        ...(cityFilter != null ? { homeCity: [Number(cityFilter)] } : {}),
        // TODO conversion
        ...(applicantTypeFilter != null
          ? { applicantType: [transformApplicantType(applicantTypeFilter)] }
          : {}),
        ...(purposeFilter != null ? { purpose: [Number(purposeFilter)] } : {}),
        ...(ageGroupFilter != null
          ? { ageGroup: [Number(ageGroupFilter)] }
          : {}),
        reservationUnit:
          selectedReservationUnit?.pk != null
            ? [selectedReservationUnit.pk]
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

  // TODO if unit selection changes and new list doesn't include the selected reservation unit, clear the selection

  const applicationEvents = filterNonNullable(
    data?.applicationEvents?.edges.map((e) => e?.node)
  );

  const unitOptions = units.map((unit) => ({
    value: unit.pk ?? 0,
    label: unit.nameFi ?? "",
  }));

  useEffect(() => {
    if (units.length > 0 && unitFilter == null) {
      setUnitFilter(units[0].pk ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this is the correct list, but should be refactored
  }, [units]);

  const timeOptions = ([300, 200] as const).map((n) => ({
    value: n,
    label: t(`ApplicationEvent.priority.${n}`),
  }));

  const orderOptions = [
    {
      value: 1,
      label: `1. ${t("Allocation.filters.reservationUnitApplication")}`,
    },
    {
      value: 2,
      label: `2. ${t("Allocation.filters.reservationUnitApplication")}`,
    },
    {
      value: 3,
      label: `3. ${t("Allocation.filters.reservationUnitApplication")}`,
    },
    {
      value: 4,
      label: `4. ${t("Allocation.filters.reservationUnitApplication")}`,
    },
  ];

  // NOTE rather sketchy: this is the context event listener
  useEffect(() => {
    if (refreshApplicationEvents) {
      refetch();
      setRefreshApplicationEvents(false);
    }
  }, [refetch, refreshApplicationEvents, setRefreshApplicationEvents]);

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
          clearButtonAriaLabel={t("common.clearAllSelections")}
          label={t("Allocation.filters.unit")}
          options={unitOptions}
          disabled={unitOptions.length === 0}
          value={
            unitOptions.find((v) => v.value === Number(unitFilter)) ?? null
          }
          onChange={(val: { label: string; value: number }) => {
            setUnitFilter(val.value ?? null);
            // TODO this is wrong, unless we have a hook that resets the selectedReservationUnit
            // because it is always selected in the UI (or we have to add all option to the Tab list)
            setSelectedReservationUnit(null);
          }}
          placeholder={t("common.selectPlaceholder")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        {/* TODO is this multi select or just no select is all? */}
        <Select
          label={t("Allocation.filters.schedules")}
          clearable
          options={timeOptions}
          disabled={timeOptions.length === 0}
          value={
            timeOptions.find((v) => v.value === Number(timeFilter)) ?? null
          }
          onChange={(val?: TimeFilterOptions) =>
            setTimeFilter(val?.value ?? null)
          }
          placeholder={t("common.selectPlaceholder")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <Select
          label={t("Allocation.filters.reservationUnitOrder")}
          clearable
          options={orderOptions}
          disabled={orderOptions.length === 0}
          value={
            orderOptions.find((v) => v.value === Number(orderFilter)) ?? null
          }
          onChange={(val?: (typeof orderOptions)[0]) =>
            setOrderFilter(val?.value ?? null)
          }
          placeholder={t("common.selectPlaceholder")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        {/* TODO debounce this before updates */}
        <TextInput
          id="search"
          label={t("Allocation.filters.search")}
          onChange={(e) => setNameFilter(e.target.value)}
          value={nameFilter ?? ""}
          placeholder={t("common.textSearchPlaceHolder")}
        />
        <Select
          label={t("filters.homeCity")}
          options={cityOptions}
          disabled={cityOptions.length === 0}
          clearable
          value={
            cityOptions.find((v) => v.value === Number(cityFilter)) ?? null
          }
          onChange={(val?: (typeof cityOptions)[0]) =>
            setCityFilter(val?.value ?? null)
          }
          placeholder={t("common.textSearchPlaceHolder")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <Select
          label={t("Allocation.filters.applicantType")}
          options={customerFilterOptions}
          disabled={customerFilterOptions.length === 0}
          clearable
          value={
            customerFilterOptions.find(
              (v) => v.value === applicantTypeFilter
            ) ?? null
          }
          onChange={(val?: (typeof customerFilterOptions)[0]) =>
            setApplicantType(val?.value ?? null)
          }
          placeholder={t("common.selectPlaceholder")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <Select
          label={t("filters.ageGroup")}
          options={ageGroupOptions}
          disabled={ageGroupOptions.length === 0}
          clearable
          value={
            ageGroupOptions.find((v) => v.value === Number(ageGroupFilter)) ??
            null
          }
          onChange={(val?: (typeof ageGroupOptions)[0]) =>
            setAgeGroupFilter(val?.value ?? null)
          }
          placeholder={t("common.selectPlaceholder")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <Select
          label={t("filters.purpose")}
          options={purposeOptions}
          disabled={purposeOptions.length === 0}
          value={
            purposeOptions.find((v) => v.value === Number(purposeFilter)) ??
            null
          }
          onChange={(val?: (typeof purposeOptions)[0]) =>
            setPurposeFilter(val?.value ?? null)
          }
          placeholder={t("common.selectPlaceholder")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
      </MoreWrapper>
      <SearchTags hide={["unit"]} translateTag={translateTag} />
      <Tabs>
        <TabList>
          {/* TODO check if this is correct, it changed from two tabs to one after the filter change
           * it did improve the usability though (loading state), or it seems like
           */}
          {tabResUnits.map((reservationUnit) => (
            <Tab
              onClick={() => setSelectedReservationUnit(reservationUnit)}
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
        reservationUnit={selectedReservationUnit || reservationUnits[0]}
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
