import React, { useEffect } from "react";
import { Tabs } from "hds-react";
import { useTranslation } from "next-i18next";
import { uniqBy } from "lodash-es";
import styled from "styled-components";
import { CenterSpinner, fontMedium, H1, Strong, TabWrapper } from "common/styled";
import { hasPermission as hasUnitPermission } from "@/modules/permissionHelper";
import {
  ApplicationRoundFilterDocument,
  useAllApplicationEventsQuery,
  useApplicationSectionAllocationsQuery,
  UserPermissionChoice,
} from "@gql/gql-types";
import type {
  ApplicationRoundFilterFragment,
  ApplicationRoundFilterQuery,
  ApplicationRoundFilterQueryVariables,
  ApplicationRoundFilterUnitFragment,
  ApplicationSectionAllocationsQueryVariables,
} from "@gql/gql-types";
import { createNodeId, filterNonNullable, getNode, ignoreMaybeArray, sort, toNumber } from "common/src/helpers";
import { errorToast } from "common/src/components/toast";
import { ALLOCATION_POLL_INTERVAL, NOT_FOUND_SSR_VALUE, VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import { truncate } from "@/helpers";
import { AllocationPageContent } from "@lib/application-rounds/[id]/allocation";
import { LinkPrev } from "@/component/LinkPrev";
import { useGetFilterSearchParams, useSession } from "@/hooks";
import { gql } from "@apollo/client";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { useSearchParams } from "next/navigation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetServerSidePropsContext } from "next";
import { Error403 } from "@/component/Error403";
import { createClient } from "@/common/apolloClient";
import { Filters } from "@/lib/application-rounds/[id]/allocation/Filters";

const MAX_RES_UNIT_NAME_LENGTH = 35;

const Ingress = styled.p`
  font-size: var(--fontsize-body-xl);
  margin: 0;
`;

const TabList = styled(Tabs.TabList)`
  ${fontMedium};
`;

const Tab = styled(Tabs.Tab)`
  &&& > span:before {
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

type ApplicationRoundFilterQueryType = ApplicationRoundFilterFragment;
type ReservationUnitFilterQueryType = NonNullable<ApplicationRoundFilterQueryType>["reservationUnits"][0];

function useQueryVariables(
  applicationRound: ApplicationRoundFilterQueryType,
  defaultReservationUnitPk: number
): ApplicationSectionAllocationsQueryVariables {
  const {
    textFilter: nameFilter,
    applicantTypeFilter,
    orderFilter: preferredOrderFilter,
    ageGroupFilter,
    municipalityFilter,
    purposeFilter,
    priorityFilter,
    reservationUnitFilter,
  } = useGetFilterSearchParams();

  const includePreferredOrder10OrHigher =
    preferredOrderFilter != null && preferredOrderFilter.length > 0 ? preferredOrderFilter.some((x) => x > 10) : null;
  const selectedReservationUnit = reservationUnitFilter?.[0] ?? defaultReservationUnitPk;

  return {
    applicationRound: applicationRound.pk ?? 0,
    priority: priorityFilter,
    preferredOrder:
      preferredOrderFilter != null && preferredOrderFilter.length > 0
        ? {
            values: preferredOrderFilter,
            allHigherThan10: includePreferredOrder10OrHigher ?? false,
          }
        : undefined,
    textSearch: nameFilter,
    municipality: municipalityFilter,
    applicantType: applicantTypeFilter,
    purpose: purposeFilter,
    ageGroup: ageGroupFilter,
    reservationUnit: selectedReservationUnit,
    applicationStatus: VALID_ALLOCATION_APPLICATION_STATUSES,
    beginDate: applicationRound?.reservationPeriodBeginDate ?? "",
    endDate: applicationRound?.reservationPeriodEndDate ?? "",
  };
}

function mapOrderFilter(val: ReadonlyArray<number> | number | null | undefined): number[] {
  if (val == null) {
    return [];
  }
  if (typeof val === "number") {
    return [val];
  }
  return val.filter((x): x is number => x != null);
}

interface ApplicationRoundAllocationProps {
  applicationRound: PropsNarrowed["applicationRound"];
  // TODO refactor the others to use the RoundNode
  units: ApplicationRoundFilterUnitFragment[];
  reservationUnits: ReservationUnitFilterQueryType[];
}

function ApplicationRoundAllocation({
  applicationRound,
  units,
  reservationUnits,
}: ApplicationRoundAllocationProps): JSX.Element {
  const { t } = useTranslation();

  const searchParams = useSearchParams();
  const setParams = useSetSearchParams();

  const setSelectedReservationUnit = (value: number | null) => {
    const setSingleValueSearchParam = (param: string, value: string | null) => {
      const vals = new URLSearchParams(searchParams);
      if (value == null) {
        vals.delete(param);
      } else {
        vals.set(param, value);
      }
      setParams(vals);
    };

    setSingleValueSearchParam("reservationUnit", value?.toString() ?? null);
  };

  const unitFilter = toNumber(searchParams.get("unit"));
  const selectedUnitReservationUnits = reservationUnits.filter(
    (ru) => ru.unit?.pk != null && ru.unit.pk === unitFilter
  );
  // remove invalid unit selection (from manipulating query param, or user has no access to the unit)
  const unitReservationUnits =
    selectedUnitReservationUnits.length > 0
      ? selectedUnitReservationUnits
      : reservationUnits.filter((ru) => ru.unit?.pk != null && ru.unit.pk === units[0]?.pk);

  const queryVariables = useQueryVariables(applicationRound, unitReservationUnits[0]?.pk ?? 0);
  const query = useApplicationSectionAllocationsQuery({
    // On purpose skip if the reservation unit is not selected (it is required)
    skip: queryVariables.reservationUnit === 0,
    pollInterval: ALLOCATION_POLL_INTERVAL,
    // NOTE required otherwise this returns stale data when filters change
    // there is an issue with the caches (sometimes returns incorrect data, not stale but incorrect)
    fetchPolicy: "network-only",
    variables: queryVariables,
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });
  const { data: refreshedData, loading, refetch, previousData, fetchMore } = query;

  // NOTE onComplete isn't called more than once
  // how this interacts with the polling is unknown
  useEffect(() => {
    const { pageInfo } = refreshedData?.applicationSections ?? {};
    if (pageInfo?.hasNextPage) {
      fetchMore({
        variables: {
          after: pageInfo.endCursor,
        },
      });
    }
  }, [refreshedData, fetchMore]);

  const data = refreshedData ?? previousData;

  const selectedReservationUnit = queryVariables.reservationUnit;
  if (selectedReservationUnit === 0) {
    // eslint-disable-next-line no-console -- TODO use logger
    console.warn("Skipping allocation query because reservation unit");
  }

  const affectingAllocations = filterNonNullable(data?.affectingAllocatedTimeSlots);

  // NOTE get the count of all application sections for the selected reservation unit
  // TODO this can be combined with the above query (but requires casting the alias)
  const { data: allEventsData, previousData: allEventsPreviousData } = useAllApplicationEventsQuery({
    skip: selectedReservationUnit == null || unitFilter == null,
    variables: {
      applicationRound: applicationRound.pk ?? 0,
      reservationUnit: [selectedReservationUnit ?? 0],
      unit: unitFilter ? [unitFilter] : [],
      applicationStatus: VALID_ALLOCATION_APPLICATION_STATUSES,
    },
    // NOTE returns incorrectly filtered data if we enable cache
    fetchPolicy: "no-cache",
  });

  // NOTE totalCount is fine, but we need to query the things we want to count otherwise it's off by a mile.
  // default to zero because filter returns empty array if no data
  const totalCount =
    allEventsData?.applicationSections?.totalCount ?? allEventsPreviousData?.applicationSections?.totalCount ?? 0;
  const allEvents = filterNonNullable(
    (allEventsData ?? allEventsPreviousData)?.applicationSections?.edges?.map((e) => e?.node)
  );
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
  const applicationSections = filterNonNullable(appEventsData?.applicationSections?.edges?.map((e) => e?.node))
    .filter((section) => {
      const opts = section.reservationUnitOptions.filter((r) => {
        if (r.allocatedTimeSlots.some((ats) => ats.reservationUnitOption.pk === r.pk)) {
          return true;
        }

        const preferredOrderFilter = mapOrderFilter(queryVariables.preferredOrder?.values);
        if (preferredOrderFilter.length > 0) {
          const includedInPreferredOrder =
            preferredOrderFilter.includes(r.preferredOrder) ||
            (queryVariables.preferredOrder?.allHigherThan10 && r.preferredOrder >= 10);
          return includedInPreferredOrder && r.reservationUnit.pk === selectedReservationUnit;
        }
        return r.reservationUnit.pk === selectedReservationUnit;
      });
      return opts.length > 0;
    })
    .map((section) => {
      // query includes locked and rejected show we can show them in the left column
      // but no allocation can be made to those
      // which are made using suitableTimeRanges so filter them out
      const opts = section.reservationUnitOptions.filter((r) => {
        if (r.reservationUnit.pk !== selectedReservationUnit) {
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

  const hideSearchTags = ["unit", "reservationUnit", "aes", "selectionBegin", "selectionEnd", "allocated"];

  const handleResetFilters = () => {
    const newParams = new URLSearchParams();
    for (const [key, value] of searchParams) {
      if (hideSearchTags.includes(key) && value !== "") {
        newParams.append(key, value);
      }
    }
    setParams(newParams);
  };

  const handleRefetchApplicationEvents = async () => {
    const id = createNodeId("ApplicationRoundNode", applicationRound.pk ?? 0);
    await query.client.refetchQueries({
      include: ["ApplicationRound", id],
    });
    return refetch();
  };

  // NOTE findIndex returns -1 if not found
  const initiallyActiveTab = unitReservationUnits.findIndex((x) => x.pk != null && x.pk === selectedReservationUnit);

  const reservationUnit =
    unitReservationUnits.find((x) => x.pk != null && x.pk === selectedReservationUnit) ?? reservationUnits[0];

  const roundName = applicationRound?.nameFi ?? "-";
  const applicationRoundStatus = applicationRound.status;

  return (
    <>
      <div>
        <H1 $noMargin>{t("allocation:allocationTitle")}</H1>
        <Ingress>{roundName}</Ingress>
      </div>
      <Filters units={units} hideSearchTags={hideSearchTags} isLoading={loading} />
      {/* using a key here is a hack to force remounting the tabs
       * remount causes flickering but HDS doesn't allow programmatically changing the active tab
       */}
      <TabWrapper>
        <Tabs initiallyActiveTab={Math.max(initiallyActiveTab, 0)} key={unitFilter ?? "unit-none"}>
          <TabList>
            {unitReservationUnits.map((ru) => (
              <Tab onClick={() => setSelectedReservationUnit(ru.pk)} key={ru?.pk}>
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
          t("allocation:countAllResults", { count: totalNumberOfEvents })
        ) : (
          <>
            <Strong>
              {applicationSections.length} / {totalNumberOfEvents}
            </Strong>
            {t("allocation:countResultsPostfix")}
            <button type="button" onClick={handleResetFilters}>
              {t("allocation:clearFiltersButton")}
            </button>
          </>
        )}
      </NumberOfResultsContainer>
      {/* NOTE there is an effect inside this component that removes "aes" query param if we don't have data */}
      {reservationUnit ? (
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

/// filter the list of individual units so user can select only the ones they have permission to
function useFilteredUnits(applicationRound: ApplicationRoundFilterQueryType | null) {
  const { user } = useSession();

  const resUnits = filterNonNullable(applicationRound?.reservationUnits);
  const unitData = resUnits.map((ru) => ru?.unit);
  const units = uniqBy(filterNonNullable(unitData), "pk");

  const hasAccess = (unit: (typeof units)[0]) =>
    unit.pk != null && hasUnitPermission(user, UserPermissionChoice.CanManageApplications, unit?.pk);

  const sortedUnits = sort(
    units.filter(hasAccess),
    // TODO name sort fails with numbers because 11 < 2
    (a, b) => a.nameFi?.localeCompare(b.nameFi ?? "") ?? 0
  );

  const reservationUnits = sort(uniqBy(resUnits, "pk"), (a, b) => a.nameFi?.localeCompare(b.nameFi ?? "") ?? 0);

  return [sortedUnits, reservationUnits] as const;
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
// NOTE any use of searchParams does a full "redraw" though React is smart enough that components
// are not actually remounted, but all hooks are re-evaluated
// so every apollo query is sent to the server (including user query, filter query, etc.)
export default function ApplicationRoundRouted(props: PropsNarrowed): JSX.Element {
  const { applicationRound } = props;

  const [filteredUnits, resUnits] = useFilteredUnits(applicationRound);
  const searchParams = useSearchParams();
  const setParams = useSetSearchParams();
  useEffect(() => {
    // oxlint-disable react/exhaustive-deps -- this is the correct list, but should be refactored
    // TODO need to add the side effect to the select filter
    // or maybe not? an invalid value is going to get filtered here anyway and we use the first reservation unit
    const setUnitFilter = (value: number) => {
      // NOTE different logic because values are not atomic and we need to set two params
      const vals = new URLSearchParams(searchParams);
      vals.set("unit", value.toString());
      vals.delete("reservationUnit");
      setParams(vals);
    };
    const unitFilter = toNumber(searchParams.get("unit"));
    if (filteredUnits.length > 0 && (unitFilter == null || unitFilter < 1)) {
      setUnitFilter(filteredUnits[0]?.pk ?? 0);
    }
    // oxlint-enable react/exhaustive-deps -- this is the correct list, but should be refactored
  }, [filteredUnits]);

  // user has no accesss to specific unit through URL with search params -> reset the filter
  useEffect(() => {
    const unit = toNumber(searchParams.get("unit"));
    if (unit != null && !filteredUnits.some((u) => u.pk === unit)) {
      const p = new URLSearchParams(searchParams);
      p.delete("unit");
      setParams(p);
    }
  }, [filteredUnits, searchParams, setParams]);

  if (filteredUnits.length === 0) {
    return <Error403 />;
  }

  return (
    <>
      <LinkPrev />
      <ApplicationRoundAllocation
        applicationRound={applicationRound}
        units={filteredUnits}
        reservationUnits={resUnits}
      />
    </>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, query, req } = ctx;
  const pk = toNumber(ignoreMaybeArray(query.id));

  if (pk == null || pk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }

  const commonProps = await getCommonServerSideProps();
  const client = createClient(commonProps.apiBaseUrl, req);
  const { data } = await client.query<ApplicationRoundFilterQuery, ApplicationRoundFilterQueryVariables>({
    query: ApplicationRoundFilterDocument,
    variables: { id: createNodeId("ApplicationRoundNode", pk) },
  });

  const applicationRound = getNode(data);
  if (applicationRound == null) {
    return NOT_FOUND_SSR_VALUE;
  }
  return {
    props: {
      applicationRound,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export const APPLICATION_SECTION_ALLOCATION_FRAGMENT = gql`
  fragment ApplicationSectionAllocation on ApplicationSectionNode {
    ...ApplicationSectionFields
    allocations
    suitableTimeRanges(filter: { fulfilled: false }) {
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
`;

export const APPLICATION_SECTIONS_FOR_ALLOCATION_QUERY = gql`
  query ApplicationSectionAllocations(
    $after: String
    # Filter
    $ageGroup: [Int!]
    $applicantType: [ReserveeType!]
    $applicationRound: Int!
    $applicationStatus: [ApplicationStatusChoice!]!
    $beginDate: Date!
    $endDate: Date!
    $municipality: [MunicipalityChoice!]
    $preferredOrder: PreferredOrderFilterInput
    $priority: [Priority!]
    $purpose: [Int!]
    $reservationUnit: Int!
    $status: [ApplicationSectionStatusChoice!]
    $textSearch: String
  ) {
    applicationSections(
      after: $after
      filter: {
        ageGroup: $ageGroup
        applicantType: $applicantType
        applicationRound: $applicationRound
        applicationStatus: $applicationStatus
        municipality: $municipality
        preferredOrder: $preferredOrder
        priority: $priority
        purpose: $purpose
        reservationUnit: [$reservationUnit]
        status: $status
        textSearch: $textSearch
      }
    ) {
      edges {
        node {
          ...ApplicationSectionAllocation
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
    $applicationStatus: [ApplicationStatusChoice!]!
    $reservationUnit: [Int!]!
    $unit: [Int!]!
  ) {
    applicationSections(
      filter: {
        applicationRound: $applicationRound
        applicationStatus: $applicationStatus
        reservationUnit: $reservationUnit
        unit: $unit
      }
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

export const APPLICATION_ROUND_FILTER_FRAGMENT = gql`
  fragment ApplicationRoundFilter on ApplicationRoundNode {
    id
    pk
    nameFi
    status
    reservationPeriodBeginDate
    reservationPeriodEndDate
    reservationUnits {
      id
      pk
      nameFi
      unit {
        ...ApplicationRoundFilterUnit
      }
    }
  }
`;

/* minimal query for allocation page to populate the unit filter and reservation-units tabs
 * only needs to be done once when landing on the page
 * filtered queries only include the reservation-units that match the filters
 */
export const APPLICATION_ROUND_FILTER_OPTIONS = gql`
  query ApplicationRoundFilter($id: ID!) {
    node(id: $id) {
      ... on ApplicationRoundNode {
        ...ApplicationRoundFilter
      }
    }
  }
`;
