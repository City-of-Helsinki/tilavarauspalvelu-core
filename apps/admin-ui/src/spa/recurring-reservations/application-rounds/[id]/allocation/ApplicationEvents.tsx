import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useSearchParams } from "react-router-dom";
import { H4, fontMedium } from "common/src/common/typography";
import {
  type ApplicationSectionNode,
  type ApplicationRoundStatusChoice,
  type Query,
  ApplicationSectionStatusChoice,
  AllocatedTimeSlotNode,
} from "common/types/gql-types";
import { ReservationUnitNode, breakpoints } from "common";
import { Accordion } from "@/component/Accordion";
import { AllocationCalendar } from "./AllocationCalendar";
import { AllocationColumn } from "./AllocationColumn";
import {
  type AllocationApplicationSectionCardType,
  ApplicationSectionCard,
} from "./ApplicationEventCard";
import { useFocusApplicationEvent } from "./hooks";
import { ApolloQueryResult } from "@apollo/client";
import { filterNonNullable } from "common/src/helpers";
import { getRelatedTimeSlots } from "./modules/applicationRoundAllocation";

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

const ApplicationEventList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: var(--spacing-s);
`;

const ApplicationEventsContainer = styled.div`
  display: flex;
  flex-direction: column;

  /* most children have 2rem gap, but one has 1rem */
  gap: var(--spacing-s);
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

const EventGroupListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2-xs);
`;

/// @deprecated - this is awful we need to remove applications from here
/// the new query returns only application events (they do include their own application if needed)
const EventGroupList = ({
  applicationSections,
  focusedApplicationSection,
  setFocusedApplicationSection,
  reservationUnit,
  type,
}: {
  applicationSections: ApplicationSectionNode[];
  focusedApplicationSection?: ApplicationSectionNode;
  setFocusedApplicationSection: (section?: ApplicationSectionNode) => void;
  reservationUnit: ReservationUnitNode;
  type: AllocationApplicationSectionCardType;
}): JSX.Element => {
  if (applicationSections.length < 1) {
    return <div>-</div>;
  }
  return (
    <EventGroupListWrapper>
      {applicationSections.map((ae) => (
        <ApplicationSectionCard
          key={`${ae.pk}-${reservationUnit?.pk}`}
          applicationSection={ae}
          focusedApplicationSection={focusedApplicationSection}
          setFocusedApplicationSection={setFocusedApplicationSection}
          reservationUnit={reservationUnit}
          type={type}
        />
      ))}
    </EventGroupListWrapper>
  );
};

/// TODO are these specific to the ReservationUnit? yes
/// then we can just check this one, not the whole map
/*
function isAllocated(aes: ReservationUnitOptionNode) {
  return aes.allocatedTimeSlots != null && aes.allocatedTimeSlots.length > 0;
}
function isDeclined(aes: ReservationUnitOptionNode) {
  return aes.rejected;
}
// TODO what is the purpose of this function?
function isNotAllocated(aes: ReservationUnitOptionNode) {
  return isAllocated(aes) === false && isDeclined(aes) === false;
}
*/

// TODO combine this with the AllocationColumn Props type (it's more or less just passing it through)
type ApplicationEventsProps = {
  applicationSections: ApplicationSectionNode[] | null;
  reservationUnit: ReservationUnitNode;
  refetchApplicationEvents: () => Promise<ApolloQueryResult<Query>>;
  applicationRoundStatus: ApplicationRoundStatusChoice;
  relatedAllocations: AllocatedTimeSlotNode[];
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
  const [focused, setFocusedApplicationEvent] = useFocusApplicationEvent();
  const focusedApplicationEvent = applicationSections?.find(
    (ae) => ae.pk === focused
  );

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

  /* TODO: rework / remove
   * issues
   * Any time anything is changed in the filters or selection this is going to reset.
   * Rather make it a higher level hook (on the page level) and reset only for the few things that need it.
   * Could also include it inside the Selection hook (pass things that should cause side effects to it).
   * For now NOT reseting at all, add them individually as the client requests not before
   * 2nd note: when reseting check if the value is valid or makes sense, don't just reset it
   * 3rd note: make sure landing on the page with query params works as expected (and doesn't just remove them)
  useEffect( () => setSelectedSlots([]),
    [focusedApplicationEvent, reservationUnit]
  );
  */

  const relatedSpacesTimeSlotsByDayReduced =
    getRelatedTimeSlots(relatedAllocations);

  // TODO should use mobile menu layout if the screen is small (this page probably requires  >= 1200px)
  return (
    <Content>
      <ApplicationEventColumn
        applicationSections={applicationSections}
        reservationUnit={reservationUnit}
      />
      <AllocationCalendar
        applicationSections={applicationSections}
        focusedApplicationEvent={focusedApplicationEvent}
        relatedAllocations={relatedSpacesTimeSlotsByDayReduced}
      />
      <AllocationColumn
        applicationSections={applicationSections}
        reservationUnit={reservationUnit}
        refetchApplicationEvents={refetchApplicationEvents}
        applicationRoundStatus={applicationRoundStatus}
        relatedAllocations={relatedSpacesTimeSlotsByDayReduced}
      />
    </Content>
  );
}

function ApplicationEventColumn({
  applicationSections,
  reservationUnit,
  // TODO separate these types (use a union of two types or use Pick to define a new type)
}: Pick<
  ApplicationEventsProps,
  "applicationSections" | "reservationUnit"
>): JSX.Element {
  const { t } = useTranslation();
  const [focused, setFocusedApplicationEvent] = useFocusApplicationEvent();
  const focusedApplicationEvent = applicationSections?.find(
    (ae) => ae.pk === focused
  );

  // TODO should use fullfilled
  const isAllocated = (as: ApplicationSectionNode) =>
    as.allocations != null && as.allocations > 0;
  const allocated = filterNonNullable(
    applicationSections?.filter(
      (as) => as.status === ApplicationSectionStatusChoice.Handled
    )
  );
  // (applicationSections ?? []).filter((as) => isAllocated(as));
  /* FIXME
      ?.filter((applicationEvent) =>
        applicationEvent?.applicationEventSchedules?.every(isAllocated)
      )
      .sort((a, b) => a.name.localeCompare(b.name)) ?? [];
  */

  // TODO
  const partiallyAllocated = filterNonNullable(
    applicationSections?.filter(
      (as) =>
        as.status !== ApplicationSectionStatusChoice.Handled && isAllocated(as)
    )
  );
  /* FIXME
      ?.filter(
        (applicationEvent) =>
          applicationEvent?.applicationEventSchedules?.some(isAllocated) &&
          applicationEvent?.applicationEventSchedules?.some(isNotAllocated)
      )
      .sort((a, b) => a.name.localeCompare(b.name)) ?? [];
  */

  const isRejected = (as: ApplicationSectionNode) =>
    as.reservationUnitOptions?.map((ruo) => ruo.rejected).some(Boolean);
  const declined = (applicationSections ?? []).filter((as) => isRejected(as));
  /* FIXME
      ?.filter((ae) => ae?.applicationEventSchedules?.every(isDeclined))
      .sort((a, b) => a.name.localeCompare(b.name)) ?? [];
  */

  // take certain states and omit colliding application events
  const unallocatedApplicationEvents = (applicationSections ?? []).filter(
    (as) => !isAllocated(as)
  );
  /* FIXME
      ?.filter((applicationEvent) =>
        applicationEvent?.applicationEventSchedules?.every(isNotAllocated)
      )
      .sort((a, b) => a.name.localeCompare(b.name)) ?? [];
  */

  const handleSelectApplicationEvent = (aes?: ApplicationSectionNode) => {
    setFocusedApplicationEvent(aes);
  };

  return (
    <ApplicationEventList>
      <ApplicationEventsContainer>
        <StyledAccordion
          initiallyOpen
          $fontLarge
          headingLevel="h3"
          heading={t("Allocation.inAllocationHeader")}
        >
          <p>{t("Allocation.selectApplicant")}</p>
          <EventGroupList
            applicationSections={unallocatedApplicationEvents}
            focusedApplicationSection={focusedApplicationEvent}
            setFocusedApplicationSection={handleSelectApplicationEvent}
            reservationUnit={reservationUnit}
            type="unallocated"
          />
        </StyledAccordion>
        <H4 as="h2" style={{ margin: 0 }}>
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
            focusedApplicationSection={focusedApplicationEvent}
            setFocusedApplicationSection={handleSelectApplicationEvent}
            reservationUnit={reservationUnit}
            type="partial"
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
            focusedApplicationSection={focusedApplicationEvent}
            setFocusedApplicationSection={handleSelectApplicationEvent}
            reservationUnit={reservationUnit}
            type="allocated"
          />
        </StyledAccordion>
        <StyledAccordion
          headingLevel="h3"
          heading={t("Allocation.declinedApplicants")}
          disabled={declined.length === 0}
          initiallyOpen
        >
          <EventGroupList
            applicationSections={declined}
            focusedApplicationSection={focusedApplicationEvent}
            setFocusedApplicationSection={handleSelectApplicationEvent}
            reservationUnit={reservationUnit}
            type="declined"
          />
        </StyledAccordion>
      </ApplicationEventsContainer>
    </ApplicationEventList>
  );
}
