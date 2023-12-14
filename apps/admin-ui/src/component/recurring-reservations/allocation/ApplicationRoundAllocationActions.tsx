import { IconCross, Select } from "hds-react";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { Strong, Strongish } from "common/src/common/typography";
import styled from "styled-components";
import type { ApplicationEventNode } from "common/types/gql-types";
import { ShowAllContainer } from "common/src/components/";
import type { ReservationUnitNode } from "common";
import { ALLOCATION_CALENDAR_TIMES } from "@/common/const";
import { OptionType } from "@/common/types";
import { Accordion } from "@/component/Accordion";
import {
  ApplicationEventScheduleResultStatuses,
  getSelectedApplicationEvents,
  getSlotApplicationEvents,
  getTimeSlotOptions,
} from "./modules/applicationRoundAllocation";
import { ApplicationEventScheduleCard } from "./ApplicationEventScheduleCard";

type Props = {
  applicationEvents: ApplicationEventNode[] | null;
  reservationUnit: ReservationUnitNode;
  paintedApplicationEvents: ApplicationEventNode[];
  paintApplicationEvents: (val: ApplicationEventNode[]) => void;
  selection: string[] | null;
  setSelection: (val: string[]) => void;
  isSelecting: boolean;
  applicationEventScheduleResultStatuses: ApplicationEventScheduleResultStatuses;
};

const Wrapper = styled.div`
  position: relative;
  border: 1px solid var(--color-black-30);
  margin-top: var(--spacing-layout-l);
  padding: var(--spacing-s);
  height: fit-content;
`;

const CloseBtn = styled.button`
  background-color: transparent;
  border: none;
  position: absolute;
  top: var(--spacing-s);
  right: var(--spacing-2-xs);
  cursor: pointer;
`;

const StyledShowAllContainer = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    margin-top: var(--spacing-2-xs);
    color: var(--color-bus);
  }
`;

const TimeSelectWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding-bottom: var(--spacing-s);
  margin-top: var(--spacing-s);
  > * {
    width: calc(50% - var(--spacing-xs));
  }

  label {
    ${Strongish};
    margin-bottom: 0;
  }
`;

const TimeLabel = styled.div`
  background-color: var(--color-black-5);
  padding: var(--spacing-3-xs) var(--spacing-xs);
  ${Strongish};
  font-size: var(--fontsize-body-m);
  display: inline-block;
`;

const Heading = styled.div`
  ${Strong};
  font-size: var(--fontsize-body-m);
  margin: var(--spacing-xs) 0 var(--spacing-s);
  padding-bottom: 0;
`;

const StyledAccordion = styled(Accordion)`
  --border-color: transparent;

  > div {
    &:nth-of-type(2) {
      padding: 0;
    }
    margin: 0;
  }
`;

const EmptyState = styled.div`
  font-size: var(--fontsize-body-m);
  margin-bottom: var(--spacing-m);
`;

const getTimeLabel = (selection: string[], t: TFunction): string => {
  const [startDay, startHour, startMinute] = selection[0].split("-");
  const [, endHour, endMinute] = selection[selection.length - 1].split("-");

  return `${t(`dayLong.${startDay}`)} ${startHour}:${startMinute} - ${
    endMinute === "30"
      ? endHour + endMinute === "2330"
        ? 0
        : Number(endHour) + 1
      : endHour
  }:${endMinute === "30" ? "00" : "30"}`;
};

// TODO if the round status === RECEIVED (or draft etc.) we need to block all changes (and maybe the whole page)
// because mutations (approveSchedule) are not possible
// TODO this allows allocating when the applicationEvent is already in allocated / failed state
// which causes a mutation error
const ApplicationRoundAllocationActions = ({
  applicationEvents,
  reservationUnit,
  paintedApplicationEvents,
  paintApplicationEvents,
  selection,
  setSelection,
  isSelecting,
  applicationEventScheduleResultStatuses,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const getOptions = useCallback(
    (type: "start" | "end") => {
      if (!selection || selection.length < 1) return [];
      const day = selection[0].split("-")[0];
      const start = ALLOCATION_CALENDAR_TIMES[0];
      const end = ALLOCATION_CALENDAR_TIMES[1];
      return getTimeSlotOptions(day, start, 0, end, type === "end");
    },
    [selection]
  );

  const timeSlotStartOptions = getOptions("start");
  const timeSlotEndOptions = getOptions("end");

  // eslint-disable-next-line consistent-return
  const setSelectedTime = (startValue?: string, endValue?: string): void => {
    if (!selection) return undefined;
    const start = startValue || selection[0];
    const end = endValue || selection[selection.length - 1];
    const [, startHours, startMinutes] = start
      ? start.toString().split("-")
      : [];
    const [, endHours, endMinutes] = end ? end.toString().split("-") : [];
    const timeSlots = getTimeSlotOptions(
      selection[0].split("-")[0],
      Number(startHours),
      Number(startMinutes),
      Number(endHours)
    ).map((n) => n.value as string);

    if (endValue && endMinutes === "00") timeSlots.pop();
    setSelection(timeSlots);
    paintApplicationEvents(
      getSlotApplicationEvents(timeSlots, applicationEvents)
    );
  };

  const primaryApplicationEvents = getSelectedApplicationEvents(
    paintedApplicationEvents,
    selection,
    300
  );

  const otherApplicationEvents = getSelectedApplicationEvents(
    paintedApplicationEvents,
    selection,
    200
  );

  if (isSelecting) {
    return null;
  }

  if (!selection || selection.length < 1) {
    return null;
  }

  return (
    <Wrapper>
      <CloseBtn type="button" onClick={() => setSelection([])}>
        <IconCross />
      </CloseBtn>
      <TimeLabel>{getTimeLabel(selection, t)}</TimeLabel>
      <StyledShowAllContainer
        showAllLabel={t("Allocation.changeTime")}
        maximumNumber={0}
      >
        <TimeSelectWrapper>
          <Select
            label={t("Allocation.startingTime")}
            options={timeSlotStartOptions}
            value={timeSlotStartOptions.find((n) => n.value === selection[0])}
            onChange={(val: OptionType) => {
              const [startHours, startMinutes] = val.label
                .split(":")
                .map(Number);
              const startTime = new Date().setHours(startHours, startMinutes);
              const endOption = timeSlotEndOptions.find(
                (n) => n.value === selection[selection.length - 1]
              ) as OptionType;
              const [endHours, endMinutes] = endOption?.label
                ?.split(":")
                .map(Number) as number[];
              const endTime = new Date().setHours(endHours, endMinutes);

              const startIndex = timeSlotStartOptions.indexOf(val);
              const endValue =
                startTime >= endTime
                  ? (timeSlotEndOptions[startIndex + 1].value as string)
                  : (timeSlotEndOptions.find(
                      (n) => n.value === selection[selection.length - 1]
                    )?.value as string);
              setSelectedTime(val.value as string, endValue);
            }}
          />
          <Select
            label={t("Allocation.endingTime")}
            options={timeSlotEndOptions}
            value={timeSlotEndOptions.find(
              (n) => n.value === selection[selection.length - 1]
            )}
            onChange={(val: OptionType) =>
              setSelectedTime(undefined, val.value as string)
            }
            isOptionDisabled={(option) => {
              const [startHours, startMinutes] = timeSlotStartOptions
                .find((n) => n.value === selection[0])
                ?.label?.split(":")
                .map(Number) as number[];
              const startTime = new Date().setHours(startHours, startMinutes);
              const [endHours, endMinutes] = option.label
                .split(":")
                .map(Number);
              const endTime = new Date().setHours(endHours, endMinutes);

              return endTime <= startTime && endHours !== 0;
            }}
          />
        </TimeSelectWrapper>
      </StyledShowAllContainer>
      {(primaryApplicationEvents?.length > 0 ||
        otherApplicationEvents?.length > 0) && (
        <>
          <Heading>{t("Allocation.primaryItems")}</Heading>
          {primaryApplicationEvents?.length > 0 ? (
            primaryApplicationEvents?.map((applicationEvent) => (
              <ApplicationEventScheduleCard
                key={applicationEvent.pk}
                applicationEvent={applicationEvent}
                reservationUnit={reservationUnit}
                selection={selection}
                applicationEventScheduleResultStatuses={
                  applicationEventScheduleResultStatuses
                }
              />
            ))
          ) : (
            <EmptyState>{t("Allocation.noPrimaryItems")}</EmptyState>
          )}
        </>
      )}
      {otherApplicationEvents?.length > 0 && (
        <StyledAccordion
          heading={t("Allocation.secondaryItems")}
          initiallyOpen={primaryApplicationEvents?.length === 0}
          key={selection.join("-")}
        >
          {otherApplicationEvents.map((applicationEvent) => (
            <ApplicationEventScheduleCard
              key={applicationEvent.pk}
              applicationEvent={applicationEvent}
              reservationUnit={reservationUnit}
              selection={selection}
              applicationEventScheduleResultStatuses={
                applicationEventScheduleResultStatuses
              }
            />
          ))}
        </StyledAccordion>
      )}
      {primaryApplicationEvents?.length === 0 &&
        otherApplicationEvents?.length === 0 && (
          <EmptyState>{t("Allocation.noRequestedTimes")}</EmptyState>
        )}
    </Wrapper>
  );
};

export default ApplicationRoundAllocationActions;
