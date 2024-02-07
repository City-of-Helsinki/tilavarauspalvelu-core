import { IconAngleDown, IconAngleUp, Link, RadioButton } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import type {
  ApplicationEventNode,
  ApplicationEventScheduleNode,
} from "common/types/gql-types";
import { SemiBold, type ReservationUnitNode, fontMedium } from "common";
import { PUBLIC_URL } from "@/common/const";
import { formatDuration } from "@/common/util";
import { getApplicantName } from "@/component/applications/util";
import { ageGroup } from "@/component/reservations/requested/util";
import { filterNonNullable } from "common/src/helpers";
import { formatTime } from "./modules/applicationRoundAllocation";

export type AllocationApplicationEventCardType =
  | "unallocated"
  | "allocated"
  | "partial"
  | "declined";

type Props = {
  applicationEvent: ApplicationEventNode;
  focusedApplicationEvent?: ApplicationEventNode;
  setFocusedApplicationEvent: (val?: ApplicationEventNode) => void;
  reservationUnit?: ReservationUnitNode;
  type: AllocationApplicationEventCardType;
};

const borderCss = css<{ $type: AllocationApplicationEventCardType }>`
  border: 1px solid var(--color-black-10);
  border-left: ${({ $type }) => {
    switch ($type) {
      case "declined":
        return "4px solid var(--color-black-40)";
      case "allocated":
        return "4px solid var(--color-success)";
      case "partial":
        return "4px solid var(--color-alert-dark)";
      default:
        return "1px solid var(--color-black-10)";
    }
  }};
`;

const Card = styled.button<{ $type: AllocationApplicationEventCardType }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: var(--spacing-2-xs) var(--spacing-xs) var(--spacing-xs);
  line-height: var(--lineheight-xl);
  font-size: var(--fontsize-body-s);
  ${borderCss}
  background-color: transparent;
  text-align: left;
`;

const StyledRadioButton = styled(RadioButton)<{ $topPadding?: boolean }>`
  display: flex;
  align-self: center;
  > label {
    &:before,
    &:after {
      ${({ $topPadding }) => ($topPadding ? "top: 10px !important;" : "")}
    }
    text-align: left;

    font-family: var(--font-medium);
    font-weight: 500;
    padding-left: var(--spacing-xl) !important;
  }
  cursor: pointer;
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
`;

const ToggleButton = styled.button`
  top: var(--spacing-s);
  right: 6px;
  cursor: pointer;
  background-color: transparent;
  border: none;
`;

const Applicant = styled.span`
  padding-left: var(--spacing-xl);
  line-height: var(--lineheight-l);
`;

const Details = styled.div<{ $hidden?: boolean }>`
  display: ${({ $hidden }) => ($hidden ? "none" : "flex")};
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  border-top: 1px solid var(--color-black-20);
  margin-top: var(--spacing-xs);
  padding-top: var(--spacing-xs);
`;

const StyledLink = styled(Link)`
  color: var(--color-black);
  text-decoration: none;
  font-size: var(--fontsize-body-s);
  border: 0;
  margin-bottom: var(--spacing-2-xs);

  &:hover {
    text-decoration: underline;
  }
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

// TODO type is bad, it get's prop drilled and it should be gotten from applicationEvent instead
// if not it shold be renamed to status? "declined" | "allocated" | "unallocated" | "partiallyAllocated"
// or variation since it's used only for styling
// TODO rename, this is the Listing Card / Info Card, that doesn't have any functionality
export function ApplicationEventCard({
  applicationEvent,
  focusedApplicationEvent,
  setFocusedApplicationEvent,
  reservationUnit,
  type,
}: Props): JSX.Element | null {
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(false);

  const application = applicationEvent.application ?? null;

  // TODO can we pass through without application?
  if (application?.pk == null) {
    // eslint-disable-next-line no-console
    console.warn("ApplicationEventCard: application is missing");
    return null;
  }
  if (!applicationEvent) {
    // eslint-disable-next-line no-console
    console.warn("ApplicationEventCard: applicationEvent is missing");
    return null;
  }

  const applicantName = getApplicantName(application);
  const isActive = applicationEvent === focusedApplicationEvent;
  const parsedDuration =
    applicationEvent.minDuration === applicationEvent.maxDuration
      ? formatDuration(applicationEvent.minDuration)
      : `${formatDuration(applicationEvent.minDuration)} - ${formatDuration(
          applicationEvent.maxDuration
        )}`;

  const nReservationUnits =
    applicationEvent?.eventReservationUnits?.length ?? -1;
  const n =
    applicationEvent?.eventReservationUnits?.findIndex(
      (ru) => ru?.reservationUnit?.pk === reservationUnit?.pk
    ) ?? -1;

  const toggleSelection = () => {
    if (isActive) {
      setFocusedApplicationEvent();
    } else {
      setFocusedApplicationEvent(applicationEvent);
    }
  };

  const schedules = filterNonNullable(
    applicationEvent.applicationEventSchedules
  );
  return (
    <Card $type={type}>
      <TitleWrapper>
        {/* TODO Radio button can't be controlled, the typical hds problem, so if we use query params to make it active it doesn't work */}
        <StyledRadioButton
          id={`applicationEvent-${applicationEvent.pk}`}
          label={applicationEvent.name}
          checked={isActive}
          onClick={() => toggleSelection()}
          $topPadding
        />
        <ToggleButton onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <IconAngleUp /> : <IconAngleDown />}
        </ToggleButton>
      </TitleWrapper>
      <Applicant>
        {applicationEvent.pk}, {applicantName}
      </Applicant>
      <Details $hidden={!isExpanded}>
        {schedules.filter((x) => x.allocatedDay != null).length > 0 && (
          <SchedulesList
            schedules={schedules}
            reservationUnitPk={reservationUnit?.pk ?? 0}
            eventsPerWeek={applicationEvent.eventsPerWeek ?? 0}
          />
        )}
        <StyledLink
          // TODO use an url constructor
          href={`${PUBLIC_URL}/application/${application.pk}/details#${applicationEvent.pk}`}
          external
          openInNewTab
          openInExternalDomainAriaLabel={t("common.openToNewTab")}
        >
          {t("Allocation.openApplication")}{" "}
          <b>
            {applicationEvent.application.pk}-{applicationEvent.pk}
          </b>
        </StyledLink>
        <div>
          {t("Allocation.ageGroup")}:{" "}
          <SemiBold>
            {t("common.agesSuffix", {
              range: ageGroup(applicationEvent.ageGroup),
            })}
            , {applicationEvent.numPersons} {t("common.peopleSuffixShort")}
          </SemiBold>
        </div>
        <div>
          {t("Allocation.applicationsWeek")}:{" "}
          <SemiBold>
            {parsedDuration}, x{applicationEvent.eventsPerWeek}
          </SemiBold>
        </div>
        <div>
          {t("Allocation.desiredReservationUnit")}:{" "}
          <SemiBold>
            {n + 1}/{nReservationUnits + 1}
          </SemiBold>
        </div>
      </Details>
    </Card>
  );
}

const SelectionListContainer = styled.div`
  text-align: left;
  width: 100%;
  padding-left: var(--spacing-s);
  box-sizing: border-box;
`;

const SelectionListCount = styled.div`
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-black-20);
  ${fontMedium}
`;

function SchedulesList({
  schedules,
  reservationUnitPk,
  eventsPerWeek,
}: {
  schedules: ApplicationEventScheduleNode[];
  reservationUnitPk: number;
  eventsPerWeek: number;
}): JSX.Element {
  const { t } = useTranslation();

  const allocatedSchedules = schedules
    .filter((schedule) => schedule.allocatedDay != null)
    .sort((a, b) => (a.allocatedDay ?? 0) - (b.allocatedDay ?? 0));
  const unallocatedSchedules = schedules.filter(
    (schedule) => schedule.allocatedDay == null
  );

  return (
    <SelectionListContainer>
      {allocatedSchedules.map((schedule) => (
        <ScheduleSection
          key={schedule.pk}
          schedule={schedule}
          reservationUnitPk={reservationUnitPk}
        />
      ))}
      {unallocatedSchedules.length > 0 && (
        <SelectionListCount>
          {t("Allocation.schedulesWithoutAllocation")}{" "}
          {unallocatedSchedules.length}/{eventsPerWeek}
        </SelectionListCount>
      )}
    </SelectionListContainer>
  );
}

const ScheduleCard = styled.div`
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-black-10);
  display: flex;
  gap: 1rem;
  text-align: left;
`;

function ScheduleSection({
  schedule,
  reservationUnitPk,
}: {
  schedule: ApplicationEventScheduleNode;
  reservationUnitPk: number;
}): JSX.Element {
  const { t } = useTranslation();

  const isAllocated = schedule.allocatedDay != null;
  const day = isAllocated ? schedule.allocatedDay : schedule.day;
  const begin =
    (isAllocated ? schedule.allocatedBegin : schedule.begin) ?? undefined;
  const end = (isAllocated ? schedule.allocatedEnd : schedule.end) ?? undefined;
  const reservationUnit = schedule.allocatedReservationUnit ?? null;

  const isAllocatedInDifferentReservationUnit =
    schedule.allocatedReservationUnit != null &&
    schedule.allocatedReservationUnit.pk !== reservationUnitPk;

  return (
    <ScheduleCard key={schedule.pk}>
      {/* TODO functionality for selecting the schedule vs. an applicationEvent */}
      <StyledRadioButton
        id={`applicationEventSchedule-${schedule.pk}`}
        disabled={isAllocatedInDifferentReservationUnit}
      />
      <div>
        <SemiBold>
          {t(`dayShort.${day}`)} {formatTime(begin)}-{formatTime(end)}
        </SemiBold>
        {isAllocated ? <div>{reservationUnit?.nameFi ?? "-"}</div> : null}
      </div>
    </ScheduleCard>
  );
}
