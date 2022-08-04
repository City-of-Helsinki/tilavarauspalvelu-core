import React from "react";
import styled from "styled-components";
import {
  ApplicationEventType,
  ApplicationType,
  ReservationUnitType,
} from "../../../common/gql-types";
import { AllocationApplicationEventCardType } from "../../../common/types";
import ApplicationEventCard from "./ApplicationEventCard";

type Props = {
  applicationEvents: ApplicationEventType[];
  selectedApplicationEvent?: ApplicationEventType;
  setSelectedApplicationEvent: (
    applicationEvent?: ApplicationEventType
  ) => void;
  applications: ApplicationType[];
  reservationUnit: ReservationUnitType;
  type: AllocationApplicationEventCardType;
};

const Wrapper = styled.div``;

const ApplicationRoundApplicationApplicationEventGroupList = ({
  applicationEvents,
  selectedApplicationEvent,
  setSelectedApplicationEvent,
  applications,
  reservationUnit,
  type,
}: Props): JSX.Element => {
  return (
    <Wrapper>
      {applicationEvents.length < 1 ? (
        <div>-</div>
      ) : (
        applicationEvents.map((applicationEvent) => {
          return (
            <ApplicationEventCard
              key={`${applicationEvent.pk}-${reservationUnit.pk}`}
              applicationEvent={applicationEvent}
              selectedApplicationEvent={selectedApplicationEvent}
              setSelectedApplicationEvent={setSelectedApplicationEvent}
              applications={applications}
              reservationUnit={reservationUnit}
              type={type}
            />
          );
        })
      )}
    </Wrapper>
  );
};

export default ApplicationRoundApplicationApplicationEventGroupList;
