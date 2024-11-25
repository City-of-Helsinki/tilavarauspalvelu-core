import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useSearchParams } from "react-router-dom";
import { H4, fontMedium } from "common/src/common/typography";
import {
  type ApplicationRoundStatusChoice,
  ApplicationSectionStatusChoice,
  type ApplicationSectionAllocationsQuery,
} from "@gql/gql-types";
import { breakpoints } from "common";
import { Accordion } from "@/component/Accordion";
import { AllocationCalendar } from "./AllocationCalendar";
import { AllocationColumn } from "./AllocationColumn";
import {
  type AllocationApplicationSectionCardType,
  ApplicationSectionCard,
} from "./ApplicationEventCard";
import { useFocusApplicationEvent } from "./hooks";
import { type ApolloQueryResult } from "@apollo/client";
import { filterNonNullable } from "common/src/helpers";
import {
  type AllocatedTimeSlotNodeT,
  getRelatedTimeSlots,
  type ReservationUnitFilterQueryT,
  type SectionNodeT,
} from "./modules/applicationRoundAllocation";
import { Flex } from "common/styles/util";

// TODO max-width for the grid columns (315px, 480px, 332px)
// TODO not perfect (aligment issues with the last columns and grid end),
// fit-content is rubbish (content change -> layout jumps),
// fixed size is impossible unless we use calc
// sub grid (for the center) not yet tried
const Content = styled.div`
  font-size: var(--fontsize-body-s);
  line-height: var(--lineheight-xl);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--spacing-s);
  @media (width > ${breakpoints.l}) {
    gap: var(--spacing-l);
  }
`;

const StyledAccordion = styled(Accordion)<{ $fontLarge?: boolean }>`
  --header-font-size: ${({ $fontLarge }) =>
    $fontLarge ? "var(--fontsize-heading-m)" : "var(--fontsize-heading-xs)"};
  > div {
    padding: 0 0 var(--spacing-s) 0;
    > h2,
    > h3,
    > h4,
    > h5 {
      padding: 0;
      ${fontMedium}
    }
  }

  p {
    margin-bottom: var(--spacing-3-xs);
  }
`;

function EventGroupList({
  applicationSections,
  reservationUnit,
  type,
  refetch,
}: {
  applicationSections: SectionNodeT[];
  reservationUnit: NonNullable<ReservationUnitFilterQueryT>;
  type: AllocationApplicationSectionCardType;
  refetch: () => Promise<ApolloQueryResult<ApplicationSectionAllocationsQuery>>;
}): JSX.Element {
  if (applicationSections.length < 1) {
    return <div>-</div>;
  }

  return (
    <Flex $gap="2-xs">
      {applicationSections.map((ae) => (
        <ApplicationSectionCard
          key={`${ae.pk}-${reservationUnit?.pk}`}
          applicationSection={ae}
          reservationUnit={reservationUnit}
          type={type}
          refetch={refetch}
        />
      ))}
    </Flex>
  );
}

// TODO combine this with the AllocationColumn Props type (it's more or less just passing it through)
type ApplicationEventsProps = {
  applicationSections: SectionNodeT[] | null;
  reservationUnit: NonNullable<ReservationUnitFilterQueryT>;
  refetchApplicationEvents: () => Promise<
    ApolloQueryResult<ApplicationSectionAllocationsQuery>
  >;
  applicationRoundStatus: ApplicationRoundStatusChoice;
  relatedAllocations: Pick<
    AllocatedTimeSlotNodeT,
    "dayOfTheWeek" | "beginTime" | "endTime"
  >[];
};

/// TODO rename to something more descriptive
export function AllocationPageContent({
  applicationSections,
  reservationUnit,
  refetchApplicationEvents,
  applicationRoundStatus,
  relatedAllocations,
}: ApplicationEventsProps): JSX.Element {
  const [params] = useSearchParams();
  // TODO could also pass the applicationSections to the hook and let it handle the filtering
  // and validating that the focused application event is in the list of application events
  // could also add a reset toggle to the hook, and remove the effect from here
  const [, setFocusedApplicationEvent] = useFocusApplicationEvent();

  // When selected reservation unit changes, remove any focused application event that's not in the new reservation unit
  // TODO could include it in the hook or wrap it inside it's own
  useEffect(() => {
    const selectedAeasPk = params.get("aes");
    if (selectedAeasPk) {
      const selectedAeas = applicationSections?.find(
        (ae) => ae.pk === Number(selectedAeasPk)
      );
      setFocusedApplicationEvent(selectedAeas);
    } else {
      setFocusedApplicationEvent(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- We only care if reservationUnit changes, and adding the rest causes an infinite loop
  }, [reservationUnit, params]);

  const relatedSpacesTimeSlotsByDayReduced =
    getRelatedTimeSlots(relatedAllocations);

  // NOTE left hand cards include other reservation units as well (if they are allocated)
  // remove those from the calendar and the right hand side
  const aesForThisUnit = filterNonNullable(applicationSections)
    .filter((ae) => {
      if (ae.reservationUnitOptions.length === 0) {
        return false;
      }
      return ae.reservationUnitOptions?.some(
        (a) => a.reservationUnit.pk === reservationUnit.pk
      );
    })
    .map((ae) => ({
      ...ae,
      reservationUnitOptions: ae.reservationUnitOptions?.filter(
        (ruo) => ruo.reservationUnit.pk === reservationUnit.pk
      ),
    }));

  // TODO should use mobile menu layout if the screen is small (this page probably requires  >= 1200px)
  return (
    <Content>
      <ApplicationSectionColumn
        applicationSections={applicationSections}
        reservationUnit={reservationUnit}
        refetchApplicationEvents={refetchApplicationEvents}
      />
      <AllocationCalendar
        applicationSections={aesForThisUnit}
        relatedAllocations={relatedSpacesTimeSlotsByDayReduced}
      />
      <AllocationColumn
        applicationSections={aesForThisUnit}
        reservationUnit={reservationUnit}
        refetchApplicationEvents={refetchApplicationEvents}
        applicationRoundStatus={applicationRoundStatus}
        relatedAllocations={relatedSpacesTimeSlotsByDayReduced}
      />
    </Content>
  );
}

function ApplicationSectionColumn({
  applicationSections,
  reservationUnit,
  refetchApplicationEvents,
  // TODO separate these types (use a union of two types or use Pick to define a new type)
}: Pick<
  ApplicationEventsProps,
  "applicationSections" | "reservationUnit" | "refetchApplicationEvents"
>): JSX.Element {
  const { t } = useTranslation();

  const sections = filterNonNullable(applicationSections);

  // allocations are not specific to the reservation unit
  const isAllocated = (as: (typeof sections)[0]) =>
    as.allocations != null && as.allocations > 0;

  const isAllocatedToThisUnit = (as: (typeof sections)[0]) =>
    as.reservationUnitOptions
      .filter((ruo) => ruo.reservationUnit.pk === reservationUnit.pk)
      ?.map((ruo) => ruo.allocatedTimeSlots.length > 0)
      .some(Boolean);

  // Locked is specific to this reservation unit
  const isLocked = (as: (typeof sections)[0]) =>
    as.reservationUnitOptions
      .filter((ruo) => ruo.reservationUnit.pk === reservationUnit.pk)
      ?.map((ruo) => ruo.locked)
      .some(Boolean);
  const isRejected = (as: (typeof sections)[0]) =>
    as.reservationUnitOptions
      .filter((ruo) => ruo.reservationUnit.pk === reservationUnit.pk)
      ?.map((ruo) => ruo.rejected)
      .some(Boolean);

  // one of:
  // - handled or
  // - allocated and here and locked
  const allocated = sections.filter(
    (as) =>
      as.status === ApplicationSectionStatusChoice.Handled ||
      (isAllocated(as) && isAllocatedToThisUnit(as) && isLocked(as))
  );

  const isPartiallyAllocated = (as: (typeof sections)[0]) =>
    as.status !== ApplicationSectionStatusChoice.Handled &&
    isAllocated(as) &&
    !isLocked(as) &&
    !isRejected(as);

  const partiallyAllocated = sections.filter(isPartiallyAllocated);

  // locked or rejected but not in the allocated list
  const locked = sections
    .filter((x) => allocated.find((y) => x.pk === y.pk) == null)
    .filter((as) => isLocked(as) || isRejected(as));

  // take certain states and omit colliding application events
  const unallocatedApplicationEvents = (applicationSections ?? []).filter(
    (as) => !isAllocated(as) && !isLocked(as) && !isRejected(as)
  );

  return (
    <Flex $gap="s">
      <StyledAccordion
        initiallyOpen
        $fontLarge
        headingLevel="h3"
        heading={t("Allocation.inAllocationHeader")}
      >
        <p>{t("Allocation.selectApplicant")}</p>
        <EventGroupList
          applicationSections={unallocatedApplicationEvents}
          reservationUnit={reservationUnit}
          type="unallocated"
          refetch={refetchApplicationEvents}
        />
      </StyledAccordion>
      <H4 as="h2" $noMargin>
        {t("Allocation.allocatedHeader")}
      </H4>
      <StyledAccordion
        headingLevel="h3"
        heading={t("Allocation.partiallyAllocatedHeader")}
        disabled={partiallyAllocated.length === 0}
        initiallyOpen
      >
        <EventGroupList
          applicationSections={partiallyAllocated}
          reservationUnit={reservationUnit}
          type="partial"
          refetch={refetchApplicationEvents}
        />
      </StyledAccordion>
      <StyledAccordion
        headingLevel="h3"
        heading={t("Allocation.allocatedApplicants")}
        disabled={allocated.length === 0}
        initiallyOpen
      >
        <EventGroupList
          applicationSections={allocated}
          reservationUnit={reservationUnit}
          type="allocated"
          refetch={refetchApplicationEvents}
        />
      </StyledAccordion>
      <StyledAccordion
        headingLevel="h3"
        heading={t("Allocation.declinedApplicants")}
        disabled={locked.length === 0}
        initiallyOpen
      >
        <EventGroupList
          applicationSections={locked}
          reservationUnit={reservationUnit}
          type="declined"
          refetch={refetchApplicationEvents}
        />
      </StyledAccordion>
    </Flex>
  );
}
