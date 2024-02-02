import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useSearchParams } from "react-router-dom";
import { H4, fontMedium } from "common/src/common/typography";
import type {
  ApplicationEventNode,
  ApplicationEventScheduleNode,
  Query,
} from "common/types/gql-types";
import { ReservationUnitNode, breakpoints } from "common";
import { Accordion } from "@/component/Accordion";
import { AllocationCalendar } from "./AllocationCalendar";
import { AllocationColumn } from "./AllocationColumn";
import {
  type AllocationApplicationEventCardType,
  ApplicationEventCard,
} from "./ApplicationEventCard";
import { useFocusApplicationEvent } from "./hooks";
import { ApolloQueryResult } from "@apollo/client";

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
  applicationEvents,
  focusedApplicationEvent,
  setFocusedApplicationEvent,
  reservationUnit,
  type,
}: {
  applicationEvents: ApplicationEventNode[];
  focusedApplicationEvent?: ApplicationEventNode;
  setFocusedApplicationEvent: (applicationEvent?: ApplicationEventNode) => void;
  reservationUnit?: ReservationUnitNode;
  type: AllocationApplicationEventCardType;
}): JSX.Element => {
  if (applicationEvents.length < 1) {
    return <div>-</div>;
  }
  return (
    <EventGroupListWrapper>
      {applicationEvents.map((applicationEvent) => (
        <ApplicationEventCard
          key={`${applicationEvent.pk}-${reservationUnit?.pk}`}
          applicationEvent={applicationEvent}
          focusedApplicationEvent={focusedApplicationEvent}
          setFocusedApplicationEvent={setFocusedApplicationEvent}
          reservationUnit={reservationUnit}
          type={type}
        />
      ))}
    </EventGroupListWrapper>
  );
};

const isAllocated = (aes: ApplicationEventScheduleNode) =>
  aes.allocatedBegin != null;
const isDeclined = (aes: ApplicationEventScheduleNode) => aes.declined;
const isNotAllocated = (aes: ApplicationEventScheduleNode) =>
  aes.allocatedBegin == null && !aes.declined;

type ApplicationEventsProps = {
  applicationEvents: ApplicationEventNode[] | null;
  reservationUnit?: ReservationUnitNode;
  refetchApplicationEvents: () => Promise<ApolloQueryResult<Query>>;
};

/// TODO rename to something more descriptive
export function ApplicationEvents({
  applicationEvents,
  reservationUnit,
  refetchApplicationEvents,
}: ApplicationEventsProps): JSX.Element {
  const [params] = useSearchParams();
  // TODO could also pass the applicationEvents to the hook and let it handle the filtering
  // and validating that the focused application event is in the list of application events
  // could also add a reset toggle to the hook, and remove the effect from here
  const [focused, setFocusedApplicationEvent] = useFocusApplicationEvent();
  const focusedApplicationEvent = applicationEvents?.find(
    (ae) => ae.pk === focused
  );

  // When selected reservation unit changes, remove any focused application event that's not in the new reservation unit
  // TODO could include it in the hook or wrap it inside it's own
  useEffect(() => {
    const selectedAeasPk = params.get("aes");
    if (selectedAeasPk) {
      const selectedAeas = applicationEvents?.find(
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

  // TODO should use mobile menu layout if the screen is small (this page probably requires  >= 1200px)
  return (
    <Content>
      <ApplicationEventColumn
        applicationEvents={applicationEvents}
        reservationUnit={reservationUnit}
      />
      <AllocationCalendar
        applicationEvents={applicationEvents}
        focusedApplicationEvent={focusedApplicationEvent}
        reservationUnitPk={reservationUnit?.pk ?? 0}
      />
      <AllocationColumn
        applicationEvents={applicationEvents}
        reservationUnit={reservationUnit}
        refetchApplicationEvents={refetchApplicationEvents}
      />
    </Content>
  );
}

function ApplicationEventColumn({
  applicationEvents,
  reservationUnit,
}: Omit<ApplicationEventsProps, "refetchApplicationEvents">): JSX.Element {
  const { t } = useTranslation();
  const [focused, setFocusedApplicationEvent] = useFocusApplicationEvent();
  const focusedApplicationEvent = applicationEvents?.find(
    (ae) => ae.pk === focused
  );

  const allocated =
    applicationEvents
      ?.filter((applicationEvent) =>
        applicationEvent?.applicationEventSchedules?.every(isAllocated)
      )
      .sort((a, b) => a.name.localeCompare(b.name)) ?? [];

  const partiallyAllocated =
    applicationEvents
      ?.filter(
        (applicationEvent) =>
          applicationEvent?.applicationEventSchedules?.some(isAllocated) &&
          applicationEvent?.applicationEventSchedules?.some(isNotAllocated)
      )
      .sort((a, b) => a.name.localeCompare(b.name)) ?? [];

  const declined =
    applicationEvents
      ?.filter((ae) => ae?.applicationEventSchedules?.every(isDeclined))
      .sort((a, b) => a.name.localeCompare(b.name)) ?? [];

  // take certain states and omit colliding application events
  const unallocatedApplicationEvents =
    applicationEvents
      ?.filter((applicationEvent) =>
        applicationEvent?.applicationEventSchedules?.every(isNotAllocated)
      )
      .sort((a, b) => a.name.localeCompare(b.name)) ?? [];

  const handleSelectApplicationEvent = (aes?: ApplicationEventNode) => {
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
            applicationEvents={unallocatedApplicationEvents}
            focusedApplicationEvent={focusedApplicationEvent}
            setFocusedApplicationEvent={handleSelectApplicationEvent}
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
            applicationEvents={partiallyAllocated}
            focusedApplicationEvent={focusedApplicationEvent}
            setFocusedApplicationEvent={handleSelectApplicationEvent}
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
            applicationEvents={allocated}
            focusedApplicationEvent={focusedApplicationEvent}
            setFocusedApplicationEvent={handleSelectApplicationEvent}
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
            applicationEvents={declined}
            focusedApplicationEvent={focusedApplicationEvent}
            setFocusedApplicationEvent={handleSelectApplicationEvent}
            reservationUnit={reservationUnit}
            type="declined"
          />
        </StyledAccordion>
      </ApplicationEventsContainer>
    </ApplicationEventList>
  );
}
