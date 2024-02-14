import React, { useEffect } from "react";
import { useQuery } from "@apollo/client";
import { Select, Tabs } from "hds-react";
import { useTranslation } from "react-i18next";
import { uniqBy } from "lodash";
import { useParams, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { H1, fontBold, fontMedium } from "common/src/common/typography";
import { ShowAllContainer } from "common/src/components";
import {
  type Query,
  type QueryApplicationEventsArgs,
  type UnitType,
  type QueryApplicationsArgs,
  ApplicantTypeChoice,
  ApplicationRoundStatusChoice,
} from "common/types/gql-types";
import { type ReservationUnitNode, breakpoints } from "common";
import { filterNonNullable } from "common/src/helpers";
import { SearchTags } from "@/component/SearchTags";
import Loader from "@/component/Loader";
import BreadcrumbWrapper from "@/component/BreadcrumbWrapper";
import { useOptions } from "@/component/my-units/hooks";
import { Container as BaseContainer, autoGridCss } from "@/styles/layout";
import { useNotification } from "@/context/NotificationContext";
import { VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import usePermission from "@/hooks/usePermission";
import { Permission } from "@/modules/permissionHelper";
import { truncate } from "@/helpers";
import {
  ALL_EVENTS_PER_UNIT_QUERY,
  ALLOCATION_UNFILTERED_QUERY,
} from "./queries";
import { ApplicationEvents } from "./ApplicationEvents";
import { APPLICATIONS_EVENTS_QUERY } from "../review/queries";
import { ComboboxFilter, SearchFilter } from "@/component/QueryParamFilters";

const MAX_RES_UNIT_NAME_LENGTH = 35;

type IParams = {
  applicationRoundId: string;
};

/* TODO is the gap everywhere 24px? i.e. can we remove the override */
const Container = styled(BaseContainer)`
  gap: var(--spacing-layout-xs);
`;

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

const MoreWrapper = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    color: var(--color-bus);
  }
  .ShowAllContainer__Content {
    ${autoGridCss}
  }
`;

// Tab causes horizontal overflow without this
// because it's inside a grid so an element with fixed width and no max-width breaks the grid
const TabWrapper = styled.div`
  max-width: 95vw;
  @media (width > ${breakpoints.m}) {
    max-width: min(
      calc(95vw - var(--main-menu-width) - 2 * var(--spacing-layout-m)),
      var(--container-width-xl)
    );
  }
`;

type PriorityFilterOptions = { label: string; value: 200 | 300 };
type PkFilterOptions = { label: string; value: number };

function Filters({
  units,
  priorityOptions,
  orderOptions,
  cityOptions,
  purposeOptions,
  ageGroupOptions,
}: {
  units: UnitType[];
  priorityOptions: PriorityFilterOptions[];
  orderOptions: PkFilterOptions[];
  cityOptions: PkFilterOptions[];
  purposeOptions: PkFilterOptions[];
  ageGroupOptions: PkFilterOptions[];
}) {
  const { t } = useTranslation();
  const [searchParams, setParams] = useSearchParams();

  const customerFilterOptions = Object.keys(ApplicantTypeChoice).map(
    (value) => ({
      label: t(`Application.applicantTypes.${value.toUpperCase()}`),
      value: value as ApplicantTypeChoice,
    })
  );
  const unitOptions = units.map((unit) => ({
    value: unit.pk ?? 0,
    label: unit.nameFi ?? "",
  }));

  const unitFilter = searchParams.get("unit");
  const setUnitFilter = (value: number) => {
    // NOTE different logic because values are not atomic and we need to set two params
    const vals = new URLSearchParams(searchParams);
    vals.set("unit", value.toString());
    vals.delete("reservation-unit");
    setParams(vals, { replace: true });
  };

  useEffect(() => {
    if (units.length > 0 && unitFilter == null) {
      setUnitFilter(units[0].pk ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this is the correct list, but should be refactored
  }, [units]);

  return (
    <>
      {/* NOTE can't easily be refactored into reusable component because it has a side effect onChange */}
      <Select
        label={t("filters.label.unit")}
        options={unitOptions}
        disabled={unitOptions.length === 0}
        value={unitOptions.find((v) => v.value === Number(unitFilter)) ?? null}
        onChange={(val: { label: string; value: number }) =>
          setUnitFilter(val.value ?? null)
        }
        placeholder={t("common.selectPlaceholder")}
        clearButtonAriaLabel={t("common.clearAllSelections")}
        selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
      />
      <ComboboxFilter name="priority" options={priorityOptions} />
      <ComboboxFilter name="order" options={orderOptions} />
      <SearchFilter name="search" />
      <ComboboxFilter name="homeCity" options={cityOptions} />
      <ComboboxFilter name="applicantType" options={customerFilterOptions} />
      <ComboboxFilter name="ageGroup" options={ageGroupOptions} />
      <ComboboxFilter name="purpose" options={purposeOptions} />
    </>
  );
}

function ApplicationRoundAllocation({
  applicationRoundId,
  units,
  reservationUnits,
  roundName,
  applicationRoundStatus,
}: {
  applicationRoundId: number;
  units: UnitType[];
  reservationUnits: ReservationUnitNode[];
  // TODO do we want to prop drill these? or include it in every application event?
  roundName: string;
  applicationRoundStatus: ApplicationRoundStatusChoice;
}): JSX.Element {
  const { notifyError } = useNotification();

  const { t } = useTranslation();

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
    setParams(vals, { replace: true });
  };

  const unitReservationUnits = reservationUnits.filter(
    (ru) => ru.unit?.pk != null && ru?.unit?.pk === Number(unitFilter)
  );

  const selectedReservationUnit =
    searchParams.get("reservation-unit") ??
    unitReservationUnits?.[0]?.pk?.toString() ??
    null;

  const setSelectedReservationUnit = (value: number | null) => {
    setSingleValueSearchParam("reservation-unit", value?.toString() ?? null);
  };

  const nameFilter = searchParams.get("search");
  const applicantTypeFilter = searchParams.getAll("applicantType");
  const priorityFilter = searchParams.getAll("priority");
  const orderFilter = searchParams.getAll("order");
  const ageGroupFilter = searchParams.getAll("ageGroup");
  const cityFilter = searchParams.getAll("homeCity");
  const purposeFilter = searchParams.getAll("purpose");

  // NOTE sanitize all other query filters similar to this
  // backend returns an error on invalid filter values, but user can cause them by manipulating the url
  const priorityFilterSanitized = priorityFilter
    ?.map((x) => Number(x))
    .reduce<Array<200 | 300>>((acc, x) => {
      if (x === 200 || x === 300) {
        return [...acc, x];
      }
      return acc;
    }, []);

  // NOTE Default to 300 and 200 because there is a hidden 100 value that is not used
  const priorityFilterQuery =
    priorityFilterSanitized.length > 0 ? priorityFilterSanitized : [300, 200];
  const ageGroupFilterQuery = ageGroupFilter
    .map(Number)
    .filter(Number.isFinite);
  const cityFilterQuery = cityFilter.map(Number).filter(Number.isFinite);
  const purposeFilterQuery = purposeFilter.map(Number).filter(Number.isFinite);
  const applicantTypeFilterQuery = filterNonNullable(
    applicantTypeFilter.map((x) => transformApplicantType(x))
  );
  const reservationUnitFilterQuery = Number.isFinite(
    Number(selectedReservationUnit)
  )
    ? [Number(selectedReservationUnit)]
    : undefined;
  const unitFilterQuery = Number.isFinite(Number(unitFilter))
    ? [Number(unitFilter)]
    : undefined;
  const preferredOrderFilterQuery = orderFilter
    .map(Number)
    .filter((x) => x >= 0 && x <= 10);
  const includePreferredOrder10OrHigher =
    orderFilter.length > 0
      ? orderFilter.filter((x) => Number(x) > 10).length > 0
      : undefined;

  const { data, refetch, previousData } = useQuery<
    Query,
    QueryApplicationEventsArgs
  >(APPLICATIONS_EVENTS_QUERY, {
    skip: !applicationRoundId,
    // NOTE required otherwise this returns stale data when filters change
    fetchPolicy: "cache-and-network",
    variables: {
      applicationRound: applicationRoundId,
      // TODO unit is superflous since we are filtering by reservation unit
      unit: unitFilterQuery,
      priority: priorityFilterQuery,
      preferredOrder: preferredOrderFilterQuery,
      includePreferredOrder10OrHigher,
      textSearch: nameFilter,
      homeCity: cityFilterQuery,
      applicantType: applicantTypeFilterQuery,
      purpose: purposeFilterQuery,
      ageGroup: ageGroupFilterQuery,
      reservationUnit: reservationUnitFilterQuery,
      applicationStatus: VALID_ALLOCATION_APPLICATION_STATUSES,
    },
    onError: () => {
      notifyError(t("errors.errorFetchingData"));
    },
  });

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
      // NOTE returns incorrectly filtered data if we enable cache
      fetchPolicy: "no-cache",
    }
  );
  const allEvents = filterNonNullable(
    allEventsData?.applicationEvents?.edges.map((e) => e?.node)
  );
  const totalNumberOfEvents = allEvents.length;

  // TODO show loading state somewhere down the line
  const appEventsData = data ?? previousData;
  const applicationEvents = filterNonNullable(
    appEventsData?.applicationEvents?.edges.map((e) => e?.node)
  );

  const priorityOptions = ([300, 200] as const).map((n) => ({
    value: n,
    label: t(`ApplicationEvent.priority.${n}`),
  }));

  const orderOptions = Array.from(Array(10).keys())
    .map((n) => ({
      value: n,
      label: `${n + 1}. ${t("filters.reservationUnitApplication")}`,
    }))
    .concat([
      {
        value: 11,
        label: `${t("filters.reservationUnitApplicationOthers")}`,
      },
    ]);

  const translateTag = (key: string, value: string) => {
    switch (key) {
      case "homeCity":
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
      case "priority":
        return (
          priorityOptions.find((o) => String(o.value) === value)?.label ?? ""
        );
      case "order":
        return orderOptions.find((o) => String(o.value) === value)?.label ?? "";
      case "search":
        return value;
      default:
        return key;
    }
  };

  const hideSearchTags = [
    "unit",
    "reservation-unit",
    "aes",
    "selectionBegin",
    "selectionEnd",
  ];

  const handleResetFilters = () => {
    const newParams = hideSearchTags.reduce<typeof searchParams>(
      (acc, s) =>
        searchParams.get(s) ? { ...acc, [s]: searchParams.get(s) } : acc,
      new URLSearchParams()
    );
    setParams(newParams, { replace: true });
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
        <Filters
          units={units}
          priorityOptions={priorityOptions}
          orderOptions={orderOptions}
          cityOptions={cityOptions}
          purposeOptions={purposeOptions}
          ageGroupOptions={ageGroupOptions}
        />
      </MoreWrapper>
      <SearchTags hide={hideSearchTags} translateTag={translateTag} />
      {/* using a key here is a hack to force remounting the tabs
       * remount causes flickering but HDS doesn't allow programmatically changing the active tab
       */}
      <TabWrapper>
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
                {truncate(ru?.nameFi ?? "-", MAX_RES_UNIT_NAME_LENGTH)}
              </Tab>
            ))}
          </TabList>
          {/* NOTE: we want the tabs as buttons, without this the HDS tabs break */}
          <Tabs.TabPanel />
        </Tabs>
      </TabWrapper>
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
        refetchApplicationEvents={refetch}
        applicationRoundStatus={applicationRoundStatus}
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
    ALLOCATION_UNFILTERED_QUERY,
    {
      skip: !applicationRoundId,
      variables: {
        applicationRound: applicationRoundId ?? 0,
        status: VALID_ALLOCATION_APPLICATION_STATUSES,
      },
    }
  );

  const { t } = useTranslation();
  const { hasUnitPermission } = usePermission();

  // TODO don't use spinners, skeletons are better
  // also this blocks the sub component query (the initial with zero filters) which slows down the page load
  if (loading) {
    return <Loader />;
  }
  // TODO improve this (disabled filters if error, notify the user, but don't block the whole page)
  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error: ", error);
    return <p>{t("errors.errorFetchingData")}</p>;
  }

  const applications = filterNonNullable(
    data?.applications?.edges?.map((edge) => edge?.node)
  );

  const appRound = applications?.[0]?.applicationRound ?? undefined;
  const reservationUnits = filterNonNullable(appRound?.reservationUnits);
  const unitData = reservationUnits.map((ru) => ru?.unit);

  // TODO name sort fails with numbers because 11 < 2
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
        applicationRoundStatus={
          appRound?.status ?? ApplicationRoundStatusChoice.Upcoming
        }
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
