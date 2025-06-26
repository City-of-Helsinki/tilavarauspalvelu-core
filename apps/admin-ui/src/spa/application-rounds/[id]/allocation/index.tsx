import React, { useEffect } from "react";
import { Select, Tabs } from "hds-react";
import { useTranslation } from "react-i18next";
import { uniqBy } from "lodash-es";
import { useParams, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { CenterSpinner, fontBold, fontMedium, H1, TabWrapper } from "common/styled";
import { ShowAllContainer } from "common/src/components";
import { hasPermission as hasUnitPermission } from "@/modules/permissionHelper";
import {
  type ApplicationRoundFilterQuery,
  ApplicationRoundStatusChoice,
  MunicipalityChoice,
  ReserveeType,
  useAllApplicationEventsQuery,
  useApplicationRoundFilterQuery,
  useApplicationSectionAllocationsQuery,
  UserPermissionChoice,
} from "@gql/gql-types";
import { base64encode, convertOptionToHDS, filterNonNullable, sort, toNumber } from "common/src/helpers";
import { SearchTags } from "@/component/SearchTags";
import { useOptions } from "@/hooks";
import { errorToast } from "common/src/common/toast";
import { ALLOCATION_POLL_INTERVAL, VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import { truncate } from "@/helpers";
import { AllocationPageContent } from "./ApplicationEvents";
import { MultiSelectFilter, SearchFilter } from "@/component/QueryParamFilters";
import { convertPriorityFilter } from "./modules/applicationRoundAllocation";
import { LinkPrev } from "@/component/LinkPrev";
import { useSession } from "@/hooks/auth";
import { gql } from "@apollo/client";

const MAX_RES_UNIT_NAME_LENGTH = 35;

type IParams = {
  applicationRoundPk: string;
};

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
      return ReserveeType.Individual;
    case "Community":
      return ReserveeType.Nonprofit;
    case "Association":
      return ReserveeType.Nonprofit;
    case "Company":
      return ReserveeType.Company;
  }
  return null;
};

const transformMunicipality = (value: string | null) => {
  if (value == null) {
    return null;
  }
  switch (value) {
    case "Helsinki":
      return MunicipalityChoice.Helsinki;
    case "Other":
      return MunicipalityChoice.Other;
  }
  return null;
};

type ApplicationRoundFilterQueryType = NonNullable<ApplicationRoundFilterQuery>["applicationRound"];
type ReservationUnitFilterQueryType = NonNullable<ApplicationRoundFilterQueryType>["reservationUnits"][0];
type UnitFilterQueryType = NonNullable<ReservationUnitFilterQueryType>["unit"];

function ApplicationRoundAllocation({
  applicationRound,
  applicationRoundPk,
  units,
  reservationUnits,
  roundName,
  applicationRoundStatus,
}: {
  applicationRound: ApplicationRoundFilterQueryType;
  // TODO refactor the others to use the RoundNode
  applicationRoundPk: number;
  units: UnitFilterQueryType[];
  reservationUnits: ReservationUnitFilterQueryType[];
  // TODO do we want to prop drill these? or include it in every application event?
  roundName: string;
  applicationRoundStatus: ApplicationRoundStatusChoice;
}): JSX.Element {
  const { t } = useTranslation();

  const options = useOptions();
  const purposeOptions = options.purpose;
  const ageGroupOptions = options.ageGroup;

  const [searchParams, setParams] = useSearchParams();

  const unitFilter = toNumber(searchParams.get("unit"));
  const setSingleValueSearchParam = (param: string, value: string | null) => {
    const vals = new URLSearchParams(searchParams);
    if (value == null) {
      vals.delete(param);
    } else {
      vals.set(param, value);
    }
    setParams(vals, { replace: true });
  };

  const unitReservationUnits = reservationUnits.filter((ru) => ru.unit?.pk != null && ru.unit.pk === unitFilter);

  const selectedReservationUnit =
    searchParams.get("reservation-unit") ?? unitReservationUnits?.[0]?.pk?.toString() ?? null;

  const setSelectedReservationUnit = (value: number | null) => {
    setSingleValueSearchParam("reservation-unit", value?.toString() ?? null);
  };

  const nameFilter = searchParams.get("search");
  const applicantTypeFilter = searchParams.getAll("applicantType");
  const priorityFilter = searchParams.getAll("priority");
  const orderFilter = searchParams.getAll("order");
  const ageGroupFilter = searchParams.getAll("ageGroup");
  const municipalityFilter = searchParams.getAll("municipality");
  const purposeFilter = searchParams.getAll("purpose");

  // NOTE sanitize all other query filters similar to this
  // backend returns an error on invalid filter values, but user can cause them by manipulating the url
  const priorityFilterSanitized = convertPriorityFilter(priorityFilter);
  const priorityFilterQuery = priorityFilterSanitized.length > 0 ? priorityFilterSanitized : null;
  const ageGroupFilterQuery = ageGroupFilter.map(Number).filter(Number.isFinite);
  const municipalityFilterQuery = filterNonNullable(municipalityFilter.map((x) => transformMunicipality(x)));
  const purposeFilterQuery = purposeFilter.map(Number).filter(Number.isFinite);
  const applicantTypeFilterQuery = filterNonNullable(applicantTypeFilter.map((x) => transformApplicantType(x)));
  const reservationUnitFilterQuery = toNumber(selectedReservationUnit);
  const preferredOrderFilterQuery = orderFilter.map(Number).filter((x) => x >= 0 && x <= 10);
  const includePreferredOrder10OrHigher =
    orderFilter.length > 0 ? orderFilter.filter((x) => Number(x) > 10).length > 0 : null;

  const query = useApplicationSectionAllocationsQuery({
    // On purpose skip if the reservation unit is not selected (it is required)
    skip: !applicationRoundPk || reservationUnitFilterQuery == null,
    pollInterval: ALLOCATION_POLL_INTERVAL,
    // NOTE required otherwise this returns stale data when filters change
    // there is an issue with the caches (sometimes returns incorrect data, not stale but incorrect)
    fetchPolicy: "network-only",
    variables: {
      applicationRound: applicationRoundPk,
      priority: priorityFilterQuery,
      preferredOrder: preferredOrderFilterQuery,
      includePreferredOrder10OrHigher,
      textSearch: nameFilter,
      municipality: municipalityFilterQuery,
      applicantType: applicantTypeFilterQuery,
      purpose: purposeFilterQuery,
      ageGroup: ageGroupFilterQuery,
      reservationUnit: reservationUnitFilterQuery ?? 0,
      applicationStatus: VALID_ALLOCATION_APPLICATION_STATUSES,
      beginDate: applicationRound?.reservationPeriodBeginDate ?? "",
      endDate: applicationRound?.reservationPeriodEndDate ?? "",
    },
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
  });
  const { data, loading, refetch, previousData, fetchMore } = query;

  // NOTE onComplete isn't called more than once
  // how this interacts with the polling is unknown
  useEffect(() => {
    const { pageInfo } = data?.applicationSections ?? {};
    if (pageInfo?.hasNextPage) {
      fetchMore({
        variables: {
          after: pageInfo.endCursor,
        },
      });
    }
  }, [data, fetchMore]);

  // TODO these should check the loading state also (it's only an error if not loading)
  if (reservationUnitFilterQuery == null) {
    // eslint-disable-next-line no-console -- TODO use logger
    console.warn("Skipping allocation query because reservation unit");
  } else if (applicationRound == null) {
    // eslint-disable-next-line no-console -- TODO use logger
    console.warn("Skipping allocation query because application round is not set");
  }

  const affectingAllocations = filterNonNullable(data?.affectingAllocatedTimeSlots);

  // NOTE get the count of all application sections for the selected reservation unit
  // TODO this can be combined with the above query (but requires casting the alias)
  const { data: allEventsData } = useAllApplicationEventsQuery({
    skip: applicationRoundPk === 0 || reservationUnitFilterQuery == null || unitFilter == null,
    variables: {
      applicationRound: applicationRoundPk,
      reservationUnit: [reservationUnitFilterQuery],
      unit: [unitFilter],
      applicationStatus: VALID_ALLOCATION_APPLICATION_STATUSES,
    },
    // NOTE returns incorrectly filtered data if we enable cache
    fetchPolicy: "no-cache",
  });

  // NOTE totalCount is fine, but we need to query the things we want to count otherwise it's off by a mile.
  // default to zero because filter returns empty array if no data
  const totalCount = allEventsData?.applicationSections?.totalCount ?? 0;
  const allEvents = filterNonNullable(allEventsData?.applicationSections?.edges.map((e) => e?.node));
  if (allEvents.length !== totalCount && totalCount < 100) {
    // eslint-disable-next-line no-console -- TODO use logger
    console.warn(
      `Total count of application sections "${totalCount}" does not match array length "${allEvents.length}"`
    );
  }
  const totalNumberOfEvents = totalCount;

  // TODO show loading state somewhere down the line
  const appEventsData = data ?? previousData;

  // NOTE we can't filter the query because we need to show allocated in different units
  // so for all data we remove non allocated that don't match the preferredOrder
  // for calendar / right hand side we do more extensive filtering later.
  const applicationSections = filterNonNullable(appEventsData?.applicationSections?.edges.map((e) => e?.node))
    .filter((section) => {
      const opts = section.reservationUnitOptions.filter((r) => {
        if (r.allocatedTimeSlots.filter((ats) => ats.reservationUnitOption.pk === r.pk).length > 0) {
          return true;
        }
        if (preferredOrderFilterQuery.length > 0) {
          const includedInPreferredOrder =
            preferredOrderFilterQuery.includes(r.preferredOrder) ||
            (includePreferredOrder10OrHigher && r.preferredOrder >= 10);
          const orderFiltered = includedInPreferredOrder && r.reservationUnit.pk === reservationUnitFilterQuery;
          return orderFiltered;
        }
        return r.reservationUnit.pk === reservationUnitFilterQuery;
      });
      return opts.length > 0;
    })
    .map((section) => {
      // query includes locked and rejected show we can show them in the left column
      // but no allocation can be made to those
      // which are made using suitableTimeRanges so filter them out
      const opts = section.reservationUnitOptions.filter((r) => {
        if (r.reservationUnit.pk !== reservationUnitFilterQuery) {
          return false;
        }
        return !(r.isLocked || r.isRejected);
      });

      if (opts.length === 0) {
        return {
          ...section,
          suitableTimeRanges: [],
        };
      }
      return section;
    });

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
        label: t("filters.reservationUnitApplicationOthers"),
      },
    ]);

  const translateTag = (key: string, value: string) => {
    switch (key) {
      case "municipality":
        return t(`Application.municipalities.${value.toUpperCase()}`);
      case "textSearch":
        return value;
      case "applicantType":
        return t(`Application.applicantTypes.${value.toUpperCase()}`);
      case "purpose":
        return purposeOptions.find((o) => String(o.value) === value)?.label ?? "";
      case "ageGroup":
        return ageGroupOptions.find((o) => String(o.value) === value)?.label ?? "";
      case "priority":
        return priorityOptions.find((o) => String(o.value) === value)?.label ?? "";
      case "order":
        return orderOptions.find((o) => String(o.value) === value)?.label ?? "";
      case "search":
        return value;
      default:
        return key;
    }
  };

  const hideSearchTags = ["unit", "reservation-unit", "aes", "selectionBegin", "selectionEnd", "allocated"];

  const handleResetFilters = () => {
    const newParams = hideSearchTags.reduce<typeof searchParams>(
      (acc, s) => (searchParams.get(s) ? { ...acc, [s]: searchParams.get(s) } : acc),
      new URLSearchParams()
    );
    setParams(newParams, { replace: true });
  };

  const handleRefetchApplicationEvents = async () => {
    const id = base64encode(`ApplicationRoundNode:${applicationRoundPk}`);
    await query.client.refetchQueries({
      include: ["ApplicationRound", id],
    });
    return refetch();
  };

  // NOTE findIndex returns -1 if not found
  const initiallyActiveTab = unitReservationUnits.findIndex((x) => x.pk != null && x.pk === reservationUnitFilterQuery);

  const reservationUnit =
    unitReservationUnits.find((x) => x.pk != null && x.pk === reservationUnitFilterQuery) ?? reservationUnits[0];

  const municipalityOptions = Object.values(MunicipalityChoice).map((value) => ({
    label: t(`Application.municipalities.${value.toUpperCase()}`),
    value: value as MunicipalityChoice,
  }));
  const customerFilterOptions = Object.keys(ReserveeType).map((value) => ({
    label: t(`Application.applicantTypes.${value.toUpperCase()}`),
    value: value as ReserveeType,
  }));
  const unitOptions = units.map((unit) => ({
    value: unit?.pk ?? 0,
    label: unit?.nameFi ?? "",
  }));

  const setUnitFilter = (value: number) => {
    // NOTE different logic because values are not atomic and we need to set two params
    const vals = new URLSearchParams(searchParams);
    vals.set("unit", value.toString());
    vals.delete("reservation-unit");
    setParams(vals, { replace: true });
  };

  useEffect(() => {
    if (units.length > 0 && (unitFilter == null || unitFilter < 1)) {
      setUnitFilter(units[0]?.pk ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this is the correct list, but should be refactored
  }, [units]);

  return (
    <>
      <div>
        <H1 $noMargin>{t("Allocation.allocationTitle")}</H1>
        <Ingress>{roundName}</Ingress>
      </div>
      <ShowAllContainer
        showAllLabel={t("ReservationUnitsSearch.moreFilters")}
        showLessLabel={t("ReservationUnitsSearch.lessFilters")}
        maximumNumber={4}
      >
        <Select
          texts={{
            label: t("filters.label.unit"),
            placeholder: t("common.selectPlaceholder"),
            clearButtonAriaLabel_multiple: t("common.clearAllSelections"),
            clearButtonAriaLabel_one: t("common.removeValue"),
          }}
          clearable={false}
          options={unitOptions.map(convertOptionToHDS)}
          disabled={unitOptions.length === 0}
          value={unitOptions.find((v) => v.value === unitFilter)?.value?.toString()}
          onChange={(selection) => {
            const val = selection.find(() => true)?.value;
            const v = toNumber(val);
            if (v != null) {
              setUnitFilter(v);
            }
          }}
        />
        <MultiSelectFilter name="priority" options={priorityOptions} />
        <MultiSelectFilter name="order" options={orderOptions} />
        <SearchFilter name="search" />
        <MultiSelectFilter name="municipality" options={municipalityOptions} />
        <MultiSelectFilter name="applicantType" options={customerFilterOptions} />
        <MultiSelectFilter name="ageGroup" options={ageGroupOptions} />
        <MultiSelectFilter name="purpose" options={purposeOptions} />
      </ShowAllContainer>
      <SearchTags hide={hideSearchTags} translateTag={translateTag} />
      {/* using a key here is a hack to force remounting the tabs
       * remount causes flickering but HDS doesn't allow programmatically changing the active tab
       */}
      <TabWrapper>
        <Tabs initiallyActiveTab={initiallyActiveTab >= 0 ? initiallyActiveTab : 0} key={unitFilter ?? "unit-none"}>
          <TabList>
            {unitReservationUnits.map((ru) => (
              <Tab onClick={() => setSelectedReservationUnit(ru.pk ?? null)} key={ru?.pk}>
                {truncate(ru?.nameFi ?? "-", MAX_RES_UNIT_NAME_LENGTH)}
              </Tab>
            ))}
          </TabList>
          {/* NOTE: we want the tabs as buttons, without this the HDS tabs break */}
          <Tabs.TabPanel />
        </Tabs>
      </TabWrapper>
      <NumberOfResultsContainer>
        {applicationSections.length === totalNumberOfEvents ? (
          t("Allocation.countAllResults", { count: totalNumberOfEvents })
        ) : (
          <>
            <NumberOfResults>
              {applicationSections.length} / {totalNumberOfEvents}
            </NumberOfResults>
            {t("Allocation.countResultsPostfix")}
            <button type="button" onClick={handleResetFilters}>
              {t("Allocation.clearFiltersButton")}
            </button>
          </>
        )}
      </NumberOfResultsContainer>
      {/* NOTE there is an effect inside this component that removes "aes" query param if we don't have data */}
      {reservationUnit && !loading ? (
        <AllocationPageContent
          applicationSections={applicationSections}
          reservationUnit={reservationUnit}
          relatedAllocations={affectingAllocations}
          // TODO overly complicated but doesn't properly handle single failures
          refetchApplicationEvents={handleRefetchApplicationEvents}
          applicationRoundStatus={applicationRoundStatus}
        />
      ) : loading ? (
        <CenterSpinner />
      ) : null}
    </>
  );
}

// Do a single full query to get filter / page data
function AllocationWrapper({ applicationRoundPk }: { applicationRoundPk: number }): JSX.Element {
  const typename = "ApplicationRoundNode";
  const id = base64encode(`${typename}:${applicationRoundPk}`);
  const { loading, error, data } = useApplicationRoundFilterQuery({
    skip: !applicationRoundPk,
    variables: { id },
  });

  const { t } = useTranslation();
  const { user } = useSession();

  const { applicationRound } = data ?? {};
  const reservationUnits = filterNonNullable(applicationRound?.reservationUnits);
  const unitData = reservationUnits.map((ru) => ru?.unit);
  const units = uniqBy(filterNonNullable(unitData), "pk");

  const hasAccess = (unit: (typeof units)[0]) =>
    unit.pk != null && hasUnitPermission(user, UserPermissionChoice.CanManageApplications, unit?.pk);

  // filter the list of individual units so user can select only the ones they have permission to
  const filteredUnits = sort(
    units.filter(hasAccess),
    // TODO name sort fails with numbers because 11 < 2
    (a, b) => a.nameFi?.localeCompare(b.nameFi ?? "") ?? 0
  );

  // user has no accesss to specific unit through URL with search params -> reset the filter
  const [searchParams, setParams] = useSearchParams();
  useEffect(() => {
    const unit = toNumber(searchParams.get("unit"));
    if (unit != null && !loading && !filteredUnits.some((u) => u.pk === unit)) {
      const p = new URLSearchParams(searchParams);
      p.delete("unit");
      setParams(p, { replace: true });
    }
  }, [filteredUnits, searchParams, setParams, loading]);

  // TODO don't use spinners, skeletons are better
  // also this blocks the sub component query (the initial with zero filters) which slows down the page load
  if (loading) {
    return <CenterSpinner />;
  }

  // TODO improve this (disabled filters if error, notify the user, but don't block the whole page)
  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error: ", error);
    return <p>{t("errors.errorFetchingData")}</p>;
  }

  if (filteredUnits.length === 0) {
    return <div>{t("errors.noPermission")}</div>;
  }

  const roundName = applicationRound?.nameFi ?? "-";

  const resUnits = sort(uniqBy(reservationUnits, "pk"), (a, b) => a.nameFi?.localeCompare(b.nameFi ?? "") ?? 0);

  return (
    <ApplicationRoundAllocation
      applicationRound={applicationRound ?? null}
      applicationRoundPk={applicationRoundPk}
      units={filteredUnits}
      reservationUnits={resUnits}
      roundName={roundName}
      applicationRoundStatus={applicationRound?.status ?? ApplicationRoundStatusChoice.Upcoming}
    />
  );
}

function ApplicationRoundAllocationRouted(): JSX.Element {
  const { applicationRoundPk } = useParams<IParams>();
  const { t } = useTranslation();

  if (!applicationRoundPk || Number.isNaN(Number(applicationRoundPk))) {
    return <div>{t("errors.router.invalidApplicationRoundNumber")}</div>;
  }
  return (
    <>
      <LinkPrev />
      <AllocationWrapper applicationRoundPk={Number(applicationRoundPk)} />
    </>
  );
}

export default ApplicationRoundAllocationRouted;

export const APPLICATION_SECTIONS_FOR_ALLOCATION_QUERY = gql`
  query ApplicationSectionAllocations(
    $applicationRound: Int!
    $applicationStatus: [ApplicationStatusChoice]!
    $status: [ApplicationSectionStatusChoice]
    $applicantType: [ReserveeType]
    $preferredOrder: [Int]
    $textSearch: String
    $priority: [Priority]
    $purpose: [Int]
    $reservationUnit: Int!
    $beginDate: Date!
    $endDate: Date!
    $ageGroup: [Int]
    $municipality: [MunicipalityChoice]
    $includePreferredOrder10OrHigher: Boolean
    $after: String
  ) {
    applicationSections(
      applicationRound: $applicationRound
      applicationStatus: $applicationStatus
      status: $status
      applicantType: $applicantType
      preferredOrder: $preferredOrder
      textSearch: $textSearch
      priority: $priority
      purpose: $purpose
      reservationUnit: [$reservationUnit]
      ageGroup: $ageGroup
      municipality: $municipality
      includePreferredOrder10OrHigher: $includePreferredOrder10OrHigher
      after: $after
    ) {
      edges {
        node {
          ...ApplicationSectionFields
          allocations
          suitableTimeRanges(fulfilled: false) {
            id
            beginTime
            endTime
            dayOfTheWeek
            priority
            fulfilled
          }
          reservationUnitOptions {
            id
            pk
            isRejected
            isLocked
            allocatedTimeSlots {
              pk
              ...AllocatedTimeSlot
              reservationUnitOption {
                id
                pk
                applicationSection {
                  id
                  pk
                }
              }
            }
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
    affectingAllocatedTimeSlots(reservationUnit: $reservationUnit, beginDate: $beginDate, endDate: $endDate) {
      ...AllocatedTimeSlot
    }
  }
`;

// Query the count of the application events for that specific unit + reservationUnit
export const ALL_EVENTS_PER_UNIT_QUERY = gql`
  query AllApplicationEvents(
    $applicationRound: Int!
    $applicationStatus: [ApplicationStatusChoice]!
    $unit: [Int]!
    $reservationUnit: [Int]!
  ) {
    applicationSections(
      applicationRound: $applicationRound
      reservationUnit: $reservationUnit
      unit: $unit
      applicationStatus: $applicationStatus
    ) {
      edges {
        node {
          id
          reservationUnitOptions {
            id
            reservationUnit {
              id
              pk
              nameFi
            }
          }
        }
      }
      totalCount
    }
  }
`;

/* minimal query for allocation page to populate the unit filter and reservation-units tabs
 * only needs to be done once when landing on the page
 * filtered queries only include the reservation-units that match the filters
 */
export const APPLICATION_ROUND_FILTER_OPTIONS = gql`
  query ApplicationRoundFilter($id: ID!) {
    applicationRound(id: $id) {
      id
      nameFi
      status
      reservationPeriodBeginDate
      reservationPeriodEndDate
      reservationUnits {
        id
        pk
        nameFi
        unit {
          id
          pk
          nameFi
        }
      }
    }
  }
`;
