import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useSearchParams } from "react-router-dom";
import { H4, fontMedium } from "common/src/common/typography";
import type {
  ApplicationEventNode,
  ApplicationEventScheduleNode,
} from "common/types/gql-types";
import { ReservationUnitNode, breakpoints } from "common";
import { Accordion } from "@/component/Accordion";
import { AllocationCalendar } from "./AllocationCalendar";
import { ApplicationRoundAllocationActions } from "./ApplicationRoundAllocationActions";
import {
  type AllocationApplicationEventCardType,
  ApplicationEventCard,
} from "./ApplicationEventCard";

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
};

/// TODO rename to something more descriptive
export function ApplicationEvents({
  applicationEvents,
  reservationUnit,
}: ApplicationEventsProps): JSX.Element {
  const { t } = useTranslation();

  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [params, setParams] = useSearchParams();
  const [focusedApplicationEvent, setFocusedApplicationEvent] = useState<
    ApplicationEventNode | undefined
  >(undefined);

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
  }, [reservationUnit, applicationEvents, params]);

  // TODO this is not great
  // we should grep the selected application event where it's used not use an intermediate state for it
  useEffect(
    () => setSelectedSlots([]),
    [focusedApplicationEvent, reservationUnit]
  );

  const allocated =
    applicationEvents
      ?.filter(
        (applicationEvent) =>
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
      ?.filter(
        (applicationEvent) =>
          applicationEvent?.applicationEventSchedules?.every(isNotAllocated)
      )
      .sort((a, b) => a.name.localeCompare(b.name)) ?? [];

  // TODO this can be removed if we move this to a hook and reuse it in the other component
  // the state is already in a query param
  const handleSelectApplicationEvent = (aes?: ApplicationEventNode) => {
    setFocusedApplicationEvent(aes);
    // TODO if the applicationEvent is completely allocated => remove the selection
    if (aes?.pk != null) {
      const p = new URLSearchParams(params);
      p.set("aes", aes.pk.toString());
      setParams(p);
    } else {
      const p = new URLSearchParams(params);
      p.delete("aes");
      setParams(p);
    }
  };

  // TODO should use mobile menu layout if the screen is small (this page probably requires  >= 1200px)
  return (
    <Content>
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
      <AllocationCalendar
        applicationEvents={applicationEvents}
        focusedApplicationEvent={focusedApplicationEvent}
        selection={selectedSlots}
        setSelection={setSelectedSlots}
        reservationUnitPk={reservationUnit?.pk ?? 0}
      />
      <ApplicationRoundAllocationActions
        applicationEvents={applicationEvents}
        reservationUnit={reservationUnit}
        selection={selectedSlots}
        setSelection={setSelectedSlots}
      />
    </Content>
  );
}
