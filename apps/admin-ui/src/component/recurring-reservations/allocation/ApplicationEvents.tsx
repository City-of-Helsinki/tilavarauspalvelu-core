import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { sortBy } from "lodash";
import { H5 } from "common/src/common/typography";
import {
  ApplicationEventNode,
  ApplicationNode,
  ReservationUnitByPkType,
} from "common/types/gql-types";
import Accordion from "@/component/Accordion";
import { AllocationApplicationEventCardType } from "@/common/types";
import AllocationCalendar from "./AllocationCalendar";
import ApplicationRoundAllocationActions from "./ApplicationRoundAllocationActions";
import ApplicationEventCard from "./ApplicationEventCard";
import { getApplicationEventScheduleResultStatuses } from "./modules/applicationRoundAllocation";

const Content = styled.div`
  font-size: var(--fontsize-body-s);
  line-height: var(--lineheight-xl);
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: var(--spacing-l);
`;

const ApplicationEventList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: var(--spacing-s);
`;

const StyledH5 = styled(H5)`
  font-size: var(--fontsize-heading-xs);
`;

const ApplicationEventsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledAccordion = styled(Accordion)`
  > div {
    font-size: var(--fontsize-heading-xxs);
    padding: 0;
  }

  p {
    margin-bottom: var(--spacing-3-xs);
  }
`;

const EventGroupList = ({
  applicationEvents,
  selectedApplicationEvent,
  setSelectedApplicationEvent,
  applications,
  reservationUnit,
  type,
}: {
  applicationEvents: ApplicationEventNode[];
  selectedApplicationEvent?: ApplicationEventNode;
  setSelectedApplicationEvent: (
    applicationEvent?: ApplicationEventNode
  ) => void;
  applications: ApplicationNode[];
  reservationUnit: ReservationUnitByPkType;
  type: AllocationApplicationEventCardType;
}): JSX.Element => {
  if (applicationEvents.length < 1) {
    return <div>-</div>;
  }
  return (
    <div>
      {applicationEvents.map((applicationEvent) => (
        <ApplicationEventCard
          key={`${applicationEvent.pk}-${reservationUnit.pk}`}
          applicationEvent={applicationEvent}
          selectedApplicationEvent={selectedApplicationEvent}
          setSelectedApplicationEvent={setSelectedApplicationEvent}
          applications={applications}
          reservationUnit={reservationUnit}
          type={type}
        />
      ))}
    </div>
  );
};

type ApplicationEventsProps = {
  applications: ApplicationNode[];
  applicationEvents: ApplicationEventNode[] | null;
  reservationUnit: ReservationUnitByPkType;
};

/// TODO what is this doing? when is it shown and what does it look like?
function ApplicationEvents({
  applications,
  applicationEvents,
  reservationUnit,
}: ApplicationEventsProps): JSX.Element {
  const { t } = useTranslation();

  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [selectedApplicationEvent, setSelectedApplicationEvent] = useState<
    ApplicationEventNode | undefined
  >(undefined);
  const [paintedApplicationEvents, setPaintedApplicationEvents] = useState<
    ApplicationEventNode[]
  >([]);

  useEffect(
    () => setSelectedApplicationEvent(undefined),
    [reservationUnit, applicationEvents]
  );

  useEffect(() => setSelection([]), [selectedApplicationEvent]);
  useEffect(() => setSelection([]), [reservationUnit]);

  const allocatedUnsorted = applicationEvents?.filter((applicationEvent) =>
    applicationEvent?.applicationEventSchedules?.some(
      (aes) => aes?.allocatedBegin != null
    )
  );
  const allocatedApplicationEvents: ApplicationEventNode[] = sortBy(
    allocatedUnsorted,
    "name"
  );

  // const declinedApplicationEvents: ApplicationEventNode[] = []

  // take certain states and omit colliding application events
  const ununsorted = applicationEvents?.filter((applicationEvent) =>
    applicationEvent?.applicationEventSchedules?.some(
      (aes) => aes?.allocatedBegin == null
    )
  );
  const unallocatedApplicationEvents = sortBy(ununsorted, "name");

  const applicationEventScheduleResultStatuses =
    getApplicationEventScheduleResultStatuses(applicationEvents);

  const paintApplicationEvents = (appEvents: ApplicationEventNode[]) => {
    setPaintedApplicationEvents(appEvents);
  };

  return (
    <Content>
      <ApplicationEventList>
        <div>
          <StyledH5>{t("Allocation.applicants")}</StyledH5>
          <p>{t("Allocation.selectApplicant")}</p>
        </div>
        <ApplicationEventsContainer>
          <EventGroupList
            applicationEvents={unallocatedApplicationEvents}
            selectedApplicationEvent={selectedApplicationEvent}
            setSelectedApplicationEvent={setSelectedApplicationEvent}
            applications={applications}
            reservationUnit={reservationUnit}
            type="unallocated"
          />
          <StyledAccordion heading={t("Allocation.otherApplicants")}>
            <p>{t("Allocation.allocatedApplicants")}</p>
            <EventGroupList
              applicationEvents={allocatedApplicationEvents}
              selectedApplicationEvent={selectedApplicationEvent}
              setSelectedApplicationEvent={setSelectedApplicationEvent}
              applications={applications}
              reservationUnit={reservationUnit}
              type="allocated"
            />
            {/*
            <p>{t("Allocation.declinedApplicants")}</p>
            <EventGroupList
              applicationEvents={declinedApplicationEvents}
              selectedApplicationEvent={selectedApplicationEvent}
              setSelectedApplicationEvent={setSelectedApplicationEvent}
              applications={applications}
              reservationUnit={reservationUnit}
              type="declined"
            />
            */}
          </StyledAccordion>
        </ApplicationEventsContainer>
      </ApplicationEventList>
      <AllocationCalendar
        applicationEvents={applicationEvents}
        selectedApplicationEvent={selectedApplicationEvent}
        paintApplicationEvents={paintApplicationEvents}
        selection={selection}
        setSelection={setSelection}
        isSelecting={isSelecting}
        setIsSelecting={setIsSelecting}
        applicationEventScheduleResultStatuses={
          applicationEventScheduleResultStatuses
        }
      />
      <ApplicationRoundAllocationActions
        applications={applications}
        applicationEvents={applicationEvents}
        reservationUnit={reservationUnit}
        paintedApplicationEvents={paintedApplicationEvents}
        paintApplicationEvents={paintApplicationEvents}
        selection={selection}
        setSelection={setSelection}
        isSelecting={isSelecting}
        applicationEventScheduleResultStatuses={
          applicationEventScheduleResultStatuses
        }
      />
    </Content>
  );
}

export { ApplicationEvents };
