import React, { useState } from "react";
import { type ApolloQueryResult, gql } from "@apollo/client";
import { IconAngleDown, IconAngleUp, IconLinkExternal, IconSize, RadioButton } from "hds-react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import styled, { css } from "styled-components";
import { PopupMenu } from "ui/src/components/PopupMenu";
import { useDisplayError } from "ui/src/hooks";
import { convertWeekday } from "ui/src/modules/conversion";
import { filterNonNullable, truncate } from "ui/src/modules/helpers";
import { fontMedium, SemiBold } from "ui/src/styled";
import { MAX_ALLOCATION_CARD_UNIT_NAME_LENGTH } from "@/modules/const";
import { formatAgeGroup, getApplicantName } from "@/modules/helpers";
import { getApplicationUrl } from "@/modules/urls";
import {
  type ApplicationSectionAllocationsQuery,
  type Maybe,
  type ReservationUnitNode,
  useRejectRestMutation,
} from "@gql/gql-types";
import { useFocusAllocatedSlot, useFocusApplicationEvent } from "./hooks";
import {
  type AllocatedTimeSlotNodeT,
  createDurationString,
  formatSuitableTimeRange,
  type SectionNodeT,
} from "./modules/applicationRoundAllocation";

export type AllocationApplicationSectionCardType = "unallocated" | "allocated" | "partial" | "declined";

type ReservationUnitT = Pick<ReservationUnitNode, "pk">;

type Props = {
  applicationSection: SectionNodeT;
  reservationUnit: ReservationUnitT;
  type: AllocationApplicationSectionCardType;
  refetch: () => Promise<ApolloQueryResult<ApplicationSectionAllocationsQuery>>;
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
      case "unallocated":
        return "1px solid var(--color-black-10)";
    }
  }};
`;

const Card = styled.div<{ $type: AllocationApplicationSectionCardType }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: var(--spacing-2-xs) var(--spacing-xs) var(--spacing-xs);
  line-height: var(--lineheight-xl);
  font-size: var(--fontsize-body-s);
  ${borderCss};
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

  const nReservationUnits = applicationSection?.reservationUnitOptions?.length ?? -1;
  const n =
    applicationSection?.reservationUnitOptions?.findIndex((ru) => ru?.reservationUnit?.pk === reservationUnit?.pk) ??
    -1;

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
          eventsPerWeek={applicationSection.appliedReservationsPerWeek}
          refetch={refetch}
        />
        <StyledLink
          href={getApplicationUrl(application.pk, applicationSection.pk)}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t("allocation:openApplication")}{" "}
          <b>
            {applicationSection.application.pk}-{applicationSection.pk}
          </b>
          <IconLinkExternal size={IconSize.ExtraSmall} />
        </StyledLink>
        <div>
          {t("allocation:ageGroup")}:{" "}
          <SemiBold>
            {t("common:agesSuffix", {
              range: formatAgeGroup(applicationSection.ageGroup),
            })}
            , {applicationSection.numPersons} {t("common:peopleSuffixShort")}
          </SemiBold>
        </div>
        <div>
          {t("allocation:applicationsWeek")}:{" "}
          <SemiBold>
            {durationString}, x{applicationSection.appliedReservationsPerWeek}
          </SemiBold>
        </div>
        <div>
          {t("allocation:desiredReservationUnit")}:{" "}
          <SemiBold>
            {n + 1}/{nReservationUnits}
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
  currentReservationUnit: ReservationUnitT;
  section: SectionNodeT;
  eventsPerWeek: number;
  refetch: () => Promise<ApolloQueryResult<ApplicationSectionAllocationsQuery>>;
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
      return ruo.allocatedTimeSlots.map((ats) => ({ ...ats, reservationUnitOption: ruo }));
    })
  ).sort((a, b) => convertWeekday(a.dayOfTheWeek) - convertWeekday(b.dayOfTheWeek));

  const [mutation, { loading }] = useRejectRestMutation();

  const thisOption = section.reservationUnitOptions?.find(
    (ruo) => ruo.reservationUnit?.pk === currentReservationUnit.pk
  );
  const displayError = useDisplayError();

  const updateOption = async (pk: Maybe<number> | undefined, isLocked: boolean): Promise<void> => {
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
            isLocked,
          },
        },
      });
      refetch();
    } catch (err) {
      displayError(err);
    }
  };

  const handleLock = () => {
    return updateOption(thisOption?.pk, true);
  };

  const handleUnlock = () => {
    return updateOption(thisOption?.pk, false);
  };

  const nToAllocate = eventsPerWeek - allocatedSchedules.length;
  const isLocked = thisOption?.isLocked ?? false;
  const isRejected = thisOption?.isRejected ?? false;
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
            {t("allocation:schedulesWithoutAllocation")} {nToAllocate}/{eventsPerWeek}
          </SelectionListCount>
          <PopupMenu
            items={[
              {
                disabled: isRejected || loading,
                name: isLocked
                  ? t("allocation:unlockOptions")
                  : allocatedSchedules.length > 0
                    ? t("allocation:lockPartialOptions")
                    : t("allocation:lockOptions"),
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

// frontend modified the gql type so we have to do this magic
// better would be to use fragments that are precise not the query types
type AllocatedT = Omit<AllocatedTimeSlotNodeT, "reservationUnitOption"> & {
  reservationUnitOption: NonNullable<SectionNodeT["reservationUnitOptions"]>[0];
};

function AllocatedScheduleSection({
  allocatedTimeSlot,
  currentReservationUnit,
}: {
  allocatedTimeSlot: AllocatedT;
  currentReservationUnit: ReservationUnitT;
}): JSX.Element {
  const { t } = useTranslation();
  const [focused, setFocused] = useFocusAllocatedSlot();
  const isActive = allocatedTimeSlot.pk === focused;

  const handleSelect = () => {
    if (isActive) {
      setFocused();
    } else {
      setFocused(allocatedTimeSlot);
    }
  };

  const allocatedReservationUnit = allocatedTimeSlot.reservationUnitOption?.reservationUnit;

  const isInDifferentUnit =
    allocatedReservationUnit != null && allocatedReservationUnit.pk !== currentReservationUnit.pk;

  const combinedName = `${allocatedReservationUnit?.nameFi ?? "-"}, ${allocatedReservationUnit.unit?.nameFi ?? "-"}`;
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
        <SemiBold>{formatSuitableTimeRange(t, allocatedTimeSlot)}</SemiBold>
        <div>{truncate(combinedName, MAX_ALLOCATION_CARD_UNIT_NAME_LENGTH)}</div>
      </div>
    </ScheduleCard>
  );
}

export const REJECT_REST_MUTATION = gql`
  mutation RejectRest($input: ReservationUnitOptionUpdateMutationInput!) {
    updateReservationUnitOption(input: $input) {
      pk
      isRejected
      isLocked
    }
  }
`;
