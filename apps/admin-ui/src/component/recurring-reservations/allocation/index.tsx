import React, { useEffect, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { Select, Tabs, TextInput } from "hds-react";
import { useTranslation } from "react-i18next";
import { uniqBy } from "lodash";
import { useParams, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { H1, Strongish } from "common/src/common/typography";
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
import { AutoGrid, Container } from "@/styles/layout";
import { useNotification } from "@/context/NotificationContext";
import { useAllocationContext } from "@/context/AllocationContext";
import Loader from "@/component/Loader";
import LinkPrev from "@/component/LinkPrev";
import usePermission from "@/hooks/usePermission";
import { Permission } from "@/modules/permissionHelper";
import { APPLICATION_EVENTS_FOR_ALLOCATION } from "../queries";
import { ApplicationEvents } from "./ApplicationEvents";

const ALLOCATION_APPLICATION_STATUSES = [
  ApplicationStatusChoice.Received,
  ApplicationStatusChoice.Handled,
  ApplicationStatusChoice.ResultsSent,
  ApplicationStatusChoice.InAllocation,
];

type IParams = {
  applicationRoundId: string;
};

const Ingress = styled.p`
  font-size: var(--fontsize-body-xl);
  margin-bottom: var(--spacing-xl);
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

// TODO fix the translations for filters
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

  type TimeFilterOptions = { label: string; value: 200 | 300 };

  const { t } = useTranslation();

  const customerFilterOptions = Object.keys(ApplicantTypeChoice).map(
    (value) => ({
      label: t(`common:applicantType.${value}`),
      value: value as ApplicantTypeChoice,
    })
  );
  // TODO options (move the useOptions hook to common)
  const cityOptions: { label: string; value: number }[] = [];
  const purposeOptions: { label: string; value: number }[] = [];
  const ageGroupOptions: { label: string; value: number }[] = [];

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
          ? { applicantType: [applicantTypeFilter as ApplicantTypeChoice] }
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

  // FIXME this broke when we moved filters to the URL (it's empty always)
  const tabResUnits = reservationUnits.filter(
    (ru) => ru?.unit?.pk === unitFilter
  );

  return (
    <Container>
      <LinkPrev />
      <H1 $legacy>{t("Allocation.allocationTitle")}</H1>
      <Ingress>{roundName}</Ingress>
      {/* TODO abstract this to a component? and use the query params to save the state instead of useState */}
      <AutoGrid $minWidth="14rem">
        <Select
          clearButtonAriaLabel={t("common.clearAllSelections")}
          label={t("Allocation.filters.unit")}
          onChange={(val: { label: string; value: number }) => {
            setUnitFilter(val.value ?? null);
            // TODO this is wrong, unless we have a hook that resets the selectedReservationUnit
            // because it is always selected in the UI (or we have to add all option to the Tab list)
            setSelectedReservationUnit(null);
          }}
          options={unitOptions}
          value={
            unitOptions.find((v) => v.value === Number(unitFilter)) ?? null
          }
          placeholder={t("Allocation.filters.selectUnits")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        {/* TODO is this multi select or just no select is all? */}
        <Select
          onChange={(val?: TimeFilterOptions) =>
            setTimeFilter(val?.value ?? null)
          }
          options={timeOptions}
          clearable
          value={
            timeOptions.find((v) => v.value === Number(timeFilter)) ?? null
          }
          label={t("Allocation.filters.schedules")}
          placeholder={t("Allocation.filters.selectSchedules")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        <Select
          onChange={(val?: (typeof orderOptions)[0]) =>
            setOrderFilter(val?.value ?? null)
          }
          label={t("Allocation.filters.reservationUnitOrder")}
          clearable
          options={orderOptions}
          value={
            orderOptions.find((v) => v.value === Number(orderFilter)) ?? null
          }
          placeholder={t("Allocation.filters.selectReservationUnitOrder")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        {/* TODO debounce this before updates */}
        <TextInput
          id="search"
          label={t("Allocation.filters.search")}
          onChange={(e) => setNameFilter(e.target.value)}
          value={nameFilter ?? ""}
          placeholder={t("Allocation.filters.searchPlaceholder")}
        />
        {/* TODO homeCity */}
        <Select
          label={t("Allocation.filters.homeCity")}
          onChange={(val?: (typeof cityOptions)[0]) =>
            setCityFilter(val?.value ?? null)
          }
          options={cityOptions}
          value={
            cityOptions.find((v) => v.value === Number(cityFilter)) ?? null
          }
          placeholder={t("Allocation.filters.placeholder.homeCity")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        {/* TODO customer type */}
        <Select
          label={t("Allocation.filters.reservationUnitOrder")}
          onChange={(val?: (typeof customerFilterOptions)[0]) =>
            setApplicantType(val?.value ?? null)
          }
          options={customerFilterOptions}
          value={
            customerFilterOptions.find(
              (v) => v.value === applicantTypeFilter
            ) ?? null
          }
          placeholder={t("Allocation.filters.placeholder.customerType")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        {/* TODO age group */}
        <Select
          label={t("Allocation.filters.ageGroup")}
          onChange={(val?: (typeof ageGroupOptions)[0]) =>
            setAgeGroupFilter(val?.value ?? null)
          }
          options={ageGroupOptions}
          value={
            ageGroupOptions.find((v) => v.value === Number(ageGroupFilter)) ??
            null
          }
          placeholder={t("Allocation.filters.placeholder.ageGroup")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
        {/* TODO purpose */}
        <Select
          label={t("Allocation.filters.purpose")}
          onChange={(val?: (typeof purposeOptions)[0]) =>
            setPurposeFilter(val?.value ?? null)
          }
          options={purposeOptions}
          value={
            purposeOptions.find((v) => v.value === Number(purposeFilter)) ??
            null
          }
          placeholder={t("Allocation.filters.placeholder.purpose")}
          clearButtonAriaLabel={t("common.clearAllSelections")}
          selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
        />
      </AutoGrid>
      <SearchTags hide={["unit"]} />
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
