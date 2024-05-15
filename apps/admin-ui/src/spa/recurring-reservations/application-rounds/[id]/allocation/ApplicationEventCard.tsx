import { IconAngleDown, IconAngleUp, Link, RadioButton } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import type {
  AllocatedTimeSlotNode,
  ApplicationSectionNode,
  Maybe,
  MutationUpdateReservationUnitOptionArgs,
  Query,
  ReservationUnitNode,
} from "common/types/gql-types";
import { SemiBold, fontMedium } from "common";
import { ageGroup } from "@/component/reservations/requested/util";
import { filterNonNullable } from "common/src/helpers";
import { convertWeekday } from "common/src/conversion";
import {
  createDurationString,
  formatTime,
} from "./modules/applicationRoundAllocation";
import { useFocusAllocatedSlot, useFocusApplicationEvent } from "./hooks";
import { PopupMenu } from "@/component/PopupMenu";
import { type ApolloQueryResult, useMutation } from "@apollo/client";
import { getApplicationSectionUrl } from "@/common/urls";
import { useNotification } from "@/context/NotificationContext";
import { UPDATE_RESERVATION_UNIT_OPTION } from "./queries";
import { getApplicantName } from "@/helpers";

export type AllocationApplicationSectionCardType =
  | "unallocated"
  | "allocated"
  | "partial"
  | "declined";

type Props = {
  applicationSection: ApplicationSectionNode;
  reservationUnit: ReservationUnitNode;
  type: AllocationApplicationSectionCardType;
  refetch: () => Promise<ApolloQueryResult<Query>>;
};

const borderCss = css<{ $type: AllocationApplicationSectionCardType }>`
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

const Card = styled.button<{ $type: AllocationApplicationSectionCardType }>`
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

// TODO type is bad, it get's prop drilled and it should be gotten from applicationSection instead
// if not it shold be renamed to status? "declined" | "allocated" | "unallocated" | "partiallyAllocated"
// or variation since it's used only for styling
// TODO rename, this is the Listing Card / Info Card, that doesn't have any functionality
export function ApplicationSectionCard({
  applicationSection,
  reservationUnit,
  type,
  refetch,
}: Props): JSX.Element | null {
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(false);
  const [focused, setFocusedApplicationSection] = useFocusApplicationEvent();
  const isActive = applicationSection.pk === focused;

  const application = applicationSection.application ?? null;

  // TODO can we pass through without application?
  if (application?.pk == null) {
    // eslint-disable-next-line no-console
    console.warn("ApplicationSectionCard: application is missing");
    return null;
  }
  if (!applicationSection) {
    // eslint-disable-next-line no-console
    console.warn("ApplicationSectionCard: applicationSection is missing");
    return null;
  }

  const applicantName = getApplicantName(application);
  const durationString = createDurationString(applicationSection, t);

  const nReservationUnits =
    applicationSection?.reservationUnitOptions?.length ?? -1;
  const n =
    applicationSection?.reservationUnitOptions?.findIndex(
      (ru) => ru?.reservationUnit?.pk === reservationUnit?.pk
    ) ?? -1;

  const toggleSelection = () => {
    if (isActive) {
      setFocusedApplicationSection();
    } else {
      setFocusedApplicationSection(applicationSection);
    }
  };

  return (
    <Card $type={type}>
      <TitleWrapper>
        {/* TODO Radio button can't be controlled, the typical hds problem, so if we use query params to make it active it doesn't work */}
        <StyledRadioButton
          id={`applicationSection-${applicationSection.pk}`}
          label={applicationSection.name}
          checked={isActive}
          onClick={toggleSelection}
          $topPadding
          disabled={type === "declined"}
        />
        <ToggleButton onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <IconAngleUp /> : <IconAngleDown />}
        </ToggleButton>
      </TitleWrapper>
      <Applicant>
        {applicationSection.pk}, {applicantName}
      </Applicant>
      <Details $hidden={!isExpanded}>
        <SchedulesList
          section={applicationSection}
          currentReservationUnit={reservationUnit}
          eventsPerWeek={applicationSection.appliedReservationsPerWeek ?? 0}
          refetch={refetch}
        />
        <StyledLink
          href={getApplicationSectionUrl(application.pk, applicationSection.pk)}
          external
          openInNewTab
          openInExternalDomainAriaLabel={t("common.openToNewTab")}
        >
          {t("Allocation.openApplication")}{" "}
          <b>
            {applicationSection.application.pk}-{applicationSection.pk}
          </b>
        </StyledLink>
        <div>
          {t("Allocation.ageGroup")}:{" "}
          <SemiBold>
            {t("common.agesSuffix", {
              range: ageGroup(applicationSection.ageGroup),
            })}
            , {applicationSection.numPersons} {t("common.peopleSuffixShort")}
          </SemiBold>
        </div>
        <div>
          {t("Allocation.applicationsWeek")}:{" "}
          <SemiBold>
            {durationString}, x{applicationSection.appliedReservationsPerWeek}
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
  box-sizing: border-box;
`;

const SelectionListCount = styled.span`
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-black-20);
  ${fontMedium}
`;

function SchedulesList({
  section,
  currentReservationUnit,
  eventsPerWeek,
  refetch,
}: {
  currentReservationUnit: ReservationUnitNode;
  section: ApplicationSectionNode;
  eventsPerWeek: number;
  refetch: () => Promise<ApolloQueryResult<Query>>;
}): JSX.Element {
  const { t } = useTranslation();

  // NOTE we want only the allocated slots here, but we need the information about which reservation unit it's allocated to
  // this information is not available in the allocated time slot (it could be, but it causes extra query complexity and dublicates fields).
  const resUnitOpts = section.reservationUnitOptions?.filter(
    (ruo) => ruo.allocatedTimeSlots != null && ruo.allocatedTimeSlots.length > 0
  );
  const allocatedSchedules = filterNonNullable(
    resUnitOpts?.flatMap((ruo) => {
      if (ruo.allocatedTimeSlots == null) {
        return null;
      }
      return [
        ...ruo.allocatedTimeSlots.map((ats) => ({
          ...ats,
          reservationUnitOption: ruo,
        })),
      ];
    })
  ).sort(
    (a, b) => convertWeekday(a.dayOfTheWeek) - convertWeekday(b.dayOfTheWeek)
  );

  const [mutation, { loading }] = useMutation<
    Query,
    MutationUpdateReservationUnitOptionArgs
  >(UPDATE_RESERVATION_UNIT_OPTION);

  const thisOption = section.reservationUnitOptions?.find(
    (ruo) => ruo.reservationUnit?.pk === currentReservationUnit.pk
  );

  const { notifyError } = useNotification();

  const updateOption = async (
    pk: Maybe<number> | undefined,
    locked: boolean
  ) => {
    if (loading) {
      return;
    }
    if (pk == null) {
      return;
    }
    try {
      await mutation({
        variables: {
          input: {
            pk,
            locked,
          },
        },
      });
      refetch();
    } catch (e) {
      notifyError(t("errors.mutationFailed"));
    }
  };

  const handleLock = async () => {
    updateOption(thisOption?.pk, true);
  };

  const handleUnlock = async () => {
    updateOption(thisOption?.pk, false);
  };

  const nToAllocate = eventsPerWeek - allocatedSchedules.length;
  const isLocked = thisOption?.locked ?? false;
  const isRejected = thisOption?.rejected ?? false;
  return (
    <SelectionListContainer>
      {allocatedSchedules.map((ats) => (
        <AllocatedScheduleSection
          key={ats.pk}
          allocatedTimeSlot={ats}
          currentReservationUnit={currentReservationUnit}
        />
      ))}
      {(nToAllocate > 0 || isLocked) && (
        <div style={{ display: "flex", gap: "1rem" }}>
          <SelectionListCount>
            {t("Allocation.schedulesWithoutAllocation")} {nToAllocate}/
            {eventsPerWeek}
          </SelectionListCount>
          <PopupMenu
            items={[
              {
                disabled: isRejected || loading,
                name: isLocked
                  ? t("Allocation.unlockOptions")
                  : allocatedSchedules.length > 0
                    ? t("Allocation.lockPartialOptions")
                    : t("Allocation.lockOptions"),
                onClick: () => (isLocked ? handleUnlock() : handleLock()),
              },
            ]}
          />
        </div>
      )}
    </SelectionListContainer>
  );
}

const ScheduleCard = styled.div`
  padding: var(--spacing-xs) var(--spacing-s);
  border-bottom: 1px solid var(--color-black-10);
  display: flex;
  gap: 1rem;
  text-align: left;
`;

function AllocatedScheduleSection({
  allocatedTimeSlot,
  currentReservationUnit,
}: {
  allocatedTimeSlot: AllocatedTimeSlotNode;
  currentReservationUnit: ReservationUnitNode;
}): JSX.Element {
  const { t } = useTranslation();

  const day = convertWeekday(allocatedTimeSlot.dayOfTheWeek);
  const begin = allocatedTimeSlot.beginTime;
  const end = allocatedTimeSlot.endTime;

  const [focused, setFocused] = useFocusAllocatedSlot();
  const isActive = allocatedTimeSlot.pk === focused;

  const handleSelect = () => {
    if (isActive) {
      setFocused();
    } else {
      setFocused(allocatedTimeSlot);
    }
  };

  const allocatedReservationUnit =
    allocatedTimeSlot.reservationUnitOption?.reservationUnit;

  const isInDifferentUnit =
    allocatedReservationUnit != null &&
    allocatedReservationUnit.pk !== currentReservationUnit.pk;

  return (
    <ScheduleCard key={allocatedTimeSlot.pk}>
      {/* TODO functionality for selecting the schedule vs. an applicationSection */}
      <StyledRadioButton
        id={`applicationSectionSchedule-${allocatedTimeSlot.pk}`}
        disabled={isInDifferentUnit}
        onClick={handleSelect}
        checked={isActive}
      />
      <div>
        <SemiBold>
          {t(`dayShort.${day}`)} {formatTime(begin)}-{formatTime(end)}
        </SemiBold>
        <div>{allocatedReservationUnit?.nameFi ?? "-"}</div>
      </div>
    </ScheduleCard>
  );
}
