import React, { useEffect } from "react";
import { Tabs } from "hds-react";
import { useTranslation } from "next-i18next";
import { uniqBy } from "lodash-es";
import styled from "styled-components";
import { CenterSpinner, fontMedium, H1, Strong, TabWrapper } from "common/styled";
import { hasPermission as hasUnitPermission } from "@/modules/permissionHelper";
import {
  ApplicationRoundFilterDocument,
  type ApplicationRoundFilterQuery,
  type ApplicationRoundFilterQueryVariables,
  type ApplicationRoundFilterUnitFragment,
  useAllApplicationEventsQuery,
  useApplicationSectionAllocationsQuery,
  UserPermissionChoice,
} from "@gql/gql-types";
import {
  base64encode,
  filterNonNullable,
  ignoreMaybeArray,
  mapParamToInterger,
  sort,
  toNumber,
} from "common/src/helpers";
import { errorToast } from "common/src/components/toast";
import { ALLOCATION_POLL_INTERVAL, NOT_FOUND_SSR_VALUE, VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import { truncate } from "@/helpers";
import { AllocationPageContent, convertPriorityFilter } from "@lib/application-rounds/[id]/allocation";
import { LinkPrev } from "@/component/LinkPrev";
import { useSession } from "@/hooks/auth";
import { gql } from "@apollo/client";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { useSearchParams } from "next/navigation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";
import { Error403 } from "@/component/Error403";
import { createClient } from "@/common/apolloClient";
import { transformMunicipality, transformReserveeType } from "common/src/conversion";
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

type ApplicationRoundFilterQueryType = NonNullable<ApplicationRoundFilterQuery["applicationRound"]>;
type ReservationUnitFilterQueryType = NonNullable<ApplicationRoundFilterQueryType>["reservationUnits"][0];

function ApplicationRoundAllocation({
  applicationRound,
  units,
  reservationUnits,
}: {
  applicationRound: PropsNarrowed["applicationRound"];
  // TODO refactor the others to use the RoundNode
  units: ApplicationRoundFilterUnitFragment[];
  reservationUnits: ReservationUnitFilterQueryType[];
}): JSX.Element {
  const { t } = useTranslation();

  const roundName = applicationRound?.nameFi ?? "-";
  const applicationRoundStatus = applicationRound.status;

  const searchParams = useSearchParams();
  const setParams = useSetSearchParams();

  const unitFilter = toNumber(searchParams.get("unit"));
  const setSingleValueSearchParam = (param: string, value: string | null) => {
    const vals = new URLSearchParams(searchParams);
    if (value == null) {
      vals.delete(param);
    } else {
      vals.set(param, value);
    }
    setParams(vals);
  };

  const unitReservationUnits = reservationUnits.filter((ru) => ru.unit?.pk != null && ru.unit.pk === unitFilter);

  const selectedReservationUnit = toNumber(searchParams.get("reservation-unit")) ?? unitReservationUnits?.[0]?.pk;

  const setSelectedReservationUnit = (value: number | null) => {
    setSingleValueSearchParam("reservation-unit", value?.toString() ?? null);
  };

  const nameFilter = searchParams.get("search");
  const applicantTypeFilter = filterNonNullable(searchParams.getAll("applicantType").map(transformReserveeType));
  const preferredOrderFilter = mapParamToInterger(searchParams.getAll("order")).filter((x) => x >= 0 && x <= 10);
  const ageGroupFilter = mapParamToInterger(searchParams.getAll("ageGroup"), 1);
  const municipalityFilter = filterNonNullable(
    searchParams.getAll("municipality").map((x) => transformMunicipality(x))
  );
  const purposeFilter = mapParamToInterger(searchParams.getAll("purpose"), 1);

  const priorityFilterSanitized = convertPriorityFilter(searchParams.getAll("priority"));
  const priorityFilterQuery = priorityFilterSanitized.length > 0 ? priorityFilterSanitized : null;
  const includePreferredOrder10OrHigher =
    preferredOrderFilter.length > 0 ? preferredOrderFilter.filter((x) => x > 10).length > 0 : null;

  const query = useApplicationSectionAllocationsQuery({
    // On purpose skip if the reservation unit is not selected (it is required)
    skip: selectedReservationUnit == null,
    pollInterval: ALLOCATION_POLL_INTERVAL,
    // NOTE required otherwise this returns stale data when filters change
    // there is an issue with the caches (sometimes returns incorrect data, not stale but incorrect)
    fetchPolicy: "network-only",
    variables: {
      applicationRound: applicationRound.pk ?? 0,
      priority: priorityFilterQuery,
      preferredOrder: preferredOrderFilter,
      includePreferredOrder10OrHigher,
      textSearch: nameFilter,
      municipality: municipalityFilter,
      applicantType: applicantTypeFilter,
      purpose: purposeFilter,
      ageGroup: ageGroupFilter,
      reservationUnit: selectedReservationUnit ?? 0,
      applicationStatus: VALID_ALLOCATION_APPLICATION_STATUSES,
      beginDate: applicationRound?.reservationPeriodBeginDate ?? "",
      endDate: applicationRound?.reservationPeriodEndDate ?? "",
    },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
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
  if (selectedReservationUnit == null) {
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
    skip: selectedReservationUnit == null || unitFilter == null,
    variables: {
      applicationRound: applicationRound.pk ?? 0,
      reservationUnit: [selectedReservationUnit ?? 0],
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
        if (preferredOrderFilter.length > 0) {
          const includedInPreferredOrder =
            preferredOrderFilter.includes(r.preferredOrder) ||
            (includePreferredOrder10OrHigher && r.preferredOrder >= 10);
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

  const hideSearchTags = ["unit", "reservation-unit", "aes", "selectionBegin", "selectionEnd", "allocated"];

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
    const id = base64encode(`ApplicationRoundNode:${applicationRound.pk}`);
    await query.client.refetchQueries({
      include: ["ApplicationRound", id],
    });
    return refetch();
  };

  // NOTE findIndex returns -1 if not found
  const initiallyActiveTab = unitReservationUnits.findIndex((x) => x.pk != null && x.pk === selectedReservationUnit);

  const reservationUnit =
    unitReservationUnits.find((x) => x.pk != null && x.pk === selectedReservationUnit) ?? reservationUnits[0];

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

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
export default function ApplicationRoundRouted(props: PropsNarrowed): JSX.Element {
  const { applicationRound } = props;
  const { user } = useSession();

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

  const searchParams = useSearchParams();
  const setParams = useSetSearchParams();
  useEffect(() => {
    // TODO need to add the side effect to the select filter
    // or maybe not? an invalid value is going to get filtered here anyway and we use the first reservation unit
    const setUnitFilter = (value: number) => {
      // NOTE different logic because values are not atomic and we need to set two params
      const vals = new URLSearchParams(searchParams);
      vals.set("unit", value.toString());
      vals.delete("reservation-unit");
      setParams(vals);
    };
    const unitFilter = toNumber(searchParams.get("unit"));
    if (units.length > 0 && (unitFilter == null || unitFilter < 1)) {
      setUnitFilter(units[0]?.pk ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- this is the correct list, but should be refactored
  }, [units]);

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

  const resUnits = sort(uniqBy(reservationUnits, "pk"), (a, b) => a.nameFi?.localeCompare(b.nameFi ?? "") ?? 0);

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
    variables: { id: base64encode(`ApplicationRoundNode:${pk}`) },
  });

  const { applicationRound } = data;

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
  }
`;
