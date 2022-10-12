import { sortBy } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { H5 } from "common/src/common/typography";
import {
  ApplicationEventType,
  ApplicationType,
  ReservationUnitType,
} from "../../../common/gql-types";
import Accordion from "../../Accordion";
import { getApplicationEventScheduleResultStatuses } from "../modules/applicationRoundAllocation";
import AllocationCalendar from "./AllocationCalendar";
import ApplicationRoundAllocationActions from "./ApplicationRoundAllocationActions";
import ApplicationRoundApplicationApplicationEventGroupList from "./ApplicationRoundApplicationApplicationEventGroupList";

type Props = {
  applications: ApplicationType[];
  applicationEvents: ApplicationEventType[] | null;
  reservationUnit: ReservationUnitType;
};

const Wrapper = styled.div`
  font-size: var(--fontsize-body-s);
  line-height: var(--lineheight-xl);
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: var(--spacing-l);
`;

const ApplicationEventList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: var(--spacing-s);
`;

const Heading = styled.div``;

const StyledH5 = styled(H5)`
  font-size: var(--fontsize-heading-xs);
`;

const ApplicationEvents = styled.div`
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

const ApplicationRoundAllocationApplicationEvents = ({
  applications,
  applicationEvents,
  reservationUnit,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [selectedApplicationEvent, setSelectedApplicationEvent] = useState<
    ApplicationEventType | undefined
  >(undefined);
  const [paintedApplicationEvents, setPaintedApplicationEvents] = useState<
    ApplicationEventType[]
  >([]);

  useEffect(
    () => setSelectedApplicationEvent(undefined),
    [reservationUnit, applicationEvents]
  );

  useEffect(() => setSelection([]), [selectedApplicationEvent]);

  useEffect(() => setSelection([]), [reservationUnit]);

  const allocatedApplicationEvents = sortBy(
    applicationEvents?.filter((applicationEvent) =>
      applicationEvent?.applicationEventSchedules?.some(
        (applicationEventSchedule) =>
          applicationEventSchedule?.applicationEventScheduleResult?.accepted ===
          true
      )
    ),
    "name"
  );

  // explicitly declined application events and those that are blocked from current reservation unit
  const declinedApplicationEvents = sortBy(
    applicationEvents?.filter((applicationEvent) =>
      applicationEvent?.applicationEventSchedules?.some(
        (applicationEventSchedule) =>
          applicationEventSchedule?.applicationEventScheduleResult?.declined ===
          true
      )
    ),
    "name"
  );

  // take certain states and omit colliding application events
  const unallocatedApplicationEvents = sortBy(
    applicationEvents?.filter((applicationEvent) =>
      applicationEvent?.applicationEventSchedules?.some(
        (applicationEventSchedule) =>
          applicationEventSchedule?.applicationEventScheduleResult === null ||
          (applicationEventSchedule?.applicationEventScheduleResult
            ?.accepted === false &&
            applicationEventSchedule?.applicationEventScheduleResult
              ?.declined === false)
      )
    ),
    "name"
  );

  const applicationEventScheduleResultStatuses = useMemo(
    () => getApplicationEventScheduleResultStatuses(applicationEvents),
    [applicationEvents]
  );

  const paintApplicationEvents = (appEvents: ApplicationEventType[]) => {
    setPaintedApplicationEvents(appEvents);
  };

  return (
    <Wrapper>
      <Content>
        <ApplicationEventList>
          <Heading>
            <StyledH5>{t("Allocation.applicants")}</StyledH5>
            <p>{t("Allocation.selectApplicant")}</p>
          </Heading>
          <ApplicationEvents>
            <ApplicationRoundApplicationApplicationEventGroupList
              applicationEvents={unallocatedApplicationEvents}
              selectedApplicationEvent={selectedApplicationEvent}
              setSelectedApplicationEvent={setSelectedApplicationEvent}
              applications={applications}
              reservationUnit={reservationUnit}
              type="unallocated"
            />
            <StyledAccordion heading={t("Allocation.otherApplicants")}>
              <p>{t("Allocation.allocatedApplicants")}</p>
              <ApplicationRoundApplicationApplicationEventGroupList
                applicationEvents={allocatedApplicationEvents}
                selectedApplicationEvent={selectedApplicationEvent}
                setSelectedApplicationEvent={setSelectedApplicationEvent}
                applications={applications}
                reservationUnit={reservationUnit}
                type="allocated"
              />
              <p>{t("Allocation.declinedApplicants")}</p>
              <ApplicationRoundApplicationApplicationEventGroupList
                applicationEvents={declinedApplicationEvents}
                selectedApplicationEvent={selectedApplicationEvent}
                setSelectedApplicationEvent={setSelectedApplicationEvent}
                applications={applications}
                reservationUnit={reservationUnit}
                type="declined"
              />
            </StyledAccordion>
          </ApplicationEvents>
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
    </Wrapper>
  );
};

export default ApplicationRoundAllocationApplicationEvents;
