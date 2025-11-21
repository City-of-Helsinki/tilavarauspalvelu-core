import React, { Children, cloneElement, useEffect, useMemo, useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { useMedia } from "react-use";
import { gql } from "@apollo/client";
import { addMinutes, differenceInMinutes } from "date-fns";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import Calendar, {
  type CalendarEvent,
  type CalendarEventBuffer,
  type SlotClickProps,
  SlotProps,
} from "ui/src/components/calendar/Calendar";
import { Toolbar } from "ui/src/components/calendar/Toolbar";
import { breakpoints, RELATED_RESERVATION_STATES } from "ui/src/modules/const";
import { formatApiDate, formatDate, formatDuration, formatTime, parseUIDate } from "ui/src/modules/date-utils";
import { filterNonNullable, getLocalizationLang } from "ui/src/modules/helpers";
import { getEventBuffers } from "@ui/components/calendar/utils";
import { Legend } from "@/components/calendar/Legend";
import { useCurrentUser } from "@/hooks";
import { eventStyleGetter } from "@/modules/eventStyleGetter";
import {
  type ReservableMap,
  getBoundCheckedReservation,
  getSlotPropGetter,
  isRangeReservable,
} from "@/modules/reservable";
import {
  SLOTS_EVERY_HOUR,
  convertFormToFocustimeSlot,
  getDurationOptions,
  getNewReservation,
} from "@/modules/reservation";
import { type PendingReservationFormType } from "@/modules/schemas/reservationUnit";
import {
  type BlockingReservationFieldsFragment,
  ReservationNode,
  type ReservationTimePickerFieldsFragment,
  ReservationTypeChoice,
  useListReservationsQuery,
} from "@gql/gql-types";
import { ReservationCalendarControls } from "../calendar/ReservationCalendarControls";

type WeekOptions = "day" | "week" | "month";

// NOTE necessary for mobile touch events
function TouchCellWrapper({
  children,
  value,
  onSelectSlot,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO Calendar prop typing
any): JSX.Element {
  return cloneElement(Children.only(children), {
    onTouchEnd: () => onSelectSlot({ action: "click", slots: [value] }),
  });
}

const CalendarFooter = styled.div`
  background-color: var(--color-white);
  z-index: var(--tilavaraus-stack-order-sticky-container);

  display: flex;
  flex-direction: column-reverse;

  @media (min-width: ${breakpoints.l}) {
    flex-direction: column;
    gap: var(--spacing-2-xl);
    justify-content: space-between;
  }
`;

export type ReservationTimePickerProps = Readonly<{
  reservationUnit: ReservationTimePickerFieldsFragment;
  reservableTimes: ReservableMap;
  blockingReservations: readonly BlockingReservationFieldsFragment[];
  reservationForm: UseFormReturn<PendingReservationFormType>;
  isReservationQuotaReached: boolean;
  submitReservation: (d: PendingReservationFormType) => void;
  // TODO replace with mode selector
  loginAndSubmitButton?: JSX.Element;
  startingTimeOptions: Array<{ value: string; label: string }>;
}>;

function useSlotPropGetter({
  reservableTimes,
  reservationUnit,
}: Pick<ReservationTimePickerProps, "reservableTimes" | "reservationUnit">): (date: Date) => SlotProps {
  const activeApplicationRounds = reservationUnit.applicationRounds;
  return useMemo(() => {
    return getSlotPropGetter({
      reservableTimes,
      activeApplicationRounds,
      reservationBeginsAt: reservationUnit.reservationBeginsAt
        ? new Date(reservationUnit.reservationBeginsAt)
        : undefined,
      reservationEndsAt: reservationUnit.reservationEndsAt ? new Date(reservationUnit.reservationEndsAt) : undefined,
      reservationsMinDaysBefore: reservationUnit.reservationsMinDaysBefore ?? 0,
      reservationsMaxDaysBefore: reservationUnit.reservationsMaxDaysBefore ?? 0,
    });
  }, [
    reservableTimes,
    activeApplicationRounds,
    reservationUnit.reservationBeginsAt,
    reservationUnit.reservationEndsAt,
    reservationUnit.reservationsMinDaysBefore,
    reservationUnit.reservationsMaxDaysBefore,
  ]);
}

function useCalendarEventChange({
  reservationUnit,
  focusSlot,
  blockingReservations,
}: Pick<ReservationTimePickerProps, "reservationUnit"> & {
  focusSlot: ReturnType<typeof convertFormToFocustimeSlot>;
  blockingReservations: readonly BlockingReservationFieldsFragment[];
}): Array<CalendarEventBuffer | CalendarEvent<ReservationNode>> {
  const { t } = useTranslation();
  // TODO this doesn't optimize anything
  // any change in the event will cause a full recalculation
  return useMemo(() => {
    const shouldDisplayFocusSlot = focusSlot.isReservable;

    let focusEvent = null;
    if (shouldDisplayFocusSlot) {
      const { durationMinutes: diff, start, end } = focusSlot;
      focusEvent = {
        beginsAt: start,
        endsAt: end,
        state: "INITIAL",
        durationString: diff >= 90 ? `(${formatDuration(t, { minutes: diff })})` : "",
      };
    }

    const events = [...blockingReservations, ...(focusEvent != null ? [focusEvent] : [])].map((n) => {
      const suffix = n.state === "INITIAL" ? n.durationString : "";
      const event: CalendarEvent<ReservationNode> = {
        title: n.state === "CANCELLED" ? `${t("reservationCalendar:prefixForCancelled")}: ` : suffix,
        start: new Date(n.beginsAt ?? ""),
        end: new Date(n.endsAt ?? ""),
        allDay: false,
        // TODO refactor and remove modifying the state
        event: n as ReservationNode,
      };

      return event;
    });

    const { bufferTimeBefore, bufferTimeAfter } = reservationUnit;
    const evts = filterNonNullable(events.map((e) => e.event));
    const pendingReservation = focusSlot.isReservable
      ? {
          beginsAt: focusSlot.start.toISOString(),
          endsAt: focusSlot.end.toISOString(),
          state: "INITIAL",
          bufferTimeBefore,
          bufferTimeAfter,
          price: null,
        }
      : null;

    return [
      ...events,
      ...getEventBuffers([
        ...evts,
        // focusSlot has invalid reservations when the slot isn't properly selected
        // similar check is in calendarEvents
        ...(pendingReservation != null ? [pendingReservation] : []),
      ]),
    ];
  }, [reservationUnit, t, focusSlot, blockingReservations]);
}

export function ReservationTimePicker({
  reservationUnit,
  reservableTimes,
  reservationForm,
  isReservationQuotaReached,
  loginAndSubmitButton,
  submitReservation,
  startingTimeOptions,
  blockingReservations,
}: ReservationTimePickerProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");
  const { watch, setValue } = reservationForm;
  const activeApplicationRounds = reservationUnit.applicationRounds;
  const locale = getLocalizationLang(i18n.language);
  const dateValue = watch("date");

  const now = useMemo(() => new Date(), []);
  const focusDate = parseUIDate(dateValue) ?? new Date();

  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);
  useEffect(() => {
    setCalendarViewType(isMobile ? "day" : "week");
  }, [isMobile]);

  const focusSlot = convertFormToFocustimeSlot({
    data: watch(),
    reservationUnit,
    activeApplicationRounds,
    reservableTimes,
    blockingReservations,
  });

  const calendarEvents = useCalendarEventChange({
    reservationUnit,
    focusSlot,
    blockingReservations,
  });
  const slotPropGetter = useSlotPropGetter({
    reservableTimes,
    reservationUnit,
  });

  // TODO should come from SSR
  const { currentUser } = useCurrentUser();

  const durationOptions = getDurationOptions(reservationUnit, t);

  const handleCalendarEventChange = ({ start, end }: CalendarEvent<ReservationNode>): boolean => {
    if (isReservationQuotaReached) {
      return false;
    }

    const { start: newStart, end: newEnd } =
      getBoundCheckedReservation({
        start,
        end,
        reservationUnit,
        durationOptions,
      }) ?? {};

    if (newEnd == null || newStart == null) {
      return false;
    }
    const duration = differenceInMinutes(newEnd, newStart);

    const isReservable = isRangeReservable({
      range: {
        start: newStart,
        end: newEnd,
      },
      reservationUnit,
      reservableTimes,
      activeApplicationRounds,
      blockingReservations,
    });

    if (!isReservable) {
      return false;
    }

    // Limit the duration to the max reservation duration
    // TODO should be replaced with a utility function that is properly named
    // TODO this can be removed? or at least we should calculate the new times before doing isReservable check
    const { begin } = getNewReservation({
      start: newStart,
      end: newEnd,
      reservationUnit,
    });

    const newDate = formatDate(begin);
    const newTime = formatTime(begin);

    setValue("date", newDate, { shouldDirty: true });
    setValue("duration", duration, { shouldDirty: true });
    setValue("time", newTime, { shouldDirty: true });

    return true;
  };

  // TODO combine the logic of this and the handleCalendarEventChange
  // compared to handleDragEvent, this doesn't allow changing the duration (only the start time)
  // if the duration is not possible, the event is not moved
  const handleSlotClick = (props: SlotClickProps): boolean => {
    const { start, end } = props;
    if (isReservationQuotaReached) {
      return false;
    }

    const { end: newEnd, start: newStart } =
      getBoundCheckedReservation({
        start,
        end,
        reservationUnit,
        durationOptions,
      }) ?? {};

    if (newEnd == null || newStart == null) {
      return false;
    }

    // onClick should not change the duration
    const realEnd = addMinutes(newStart, watch("duration"));

    const isReservable = isRangeReservable({
      range: {
        start: newStart,
        end: realEnd,
      },
      reservationUnit,
      reservableTimes,
      activeApplicationRounds,
      blockingReservations,
    });
    if (!isReservable) {
      return false;
    }

    // TODO this seems superfluous
    const { begin } = getNewReservation({
      start: newStart,
      end: realEnd,
      reservationUnit,
    });

    const uiDate = formatDate(begin);
    const uiTime = formatTime(begin);
    // click doesn't change the duration
    setValue("date", uiDate, { shouldDirty: true });
    setValue("time", uiTime, { shouldDirty: true });

    return true;
  };

  // TODO add pagination
  // TODO also combine with other instances of LIST_RESERVATIONS
  const { data } = useListReservationsQuery({
    fetchPolicy: "no-cache",
    skip: !currentUser || !reservationUnit.pk,
    variables: {
      beginDate: formatApiDate(now),
      user: currentUser?.pk ?? 0,
      reservationUnits: [reservationUnit.pk ?? 0],
      state: RELATED_RESERVATION_STATES,
      reservationType: ReservationTypeChoice.Normal,
    },
  });

  const userReservations = filterNonNullable(data?.reservations?.edges?.map((e) => e?.node));

  const controlProps =
    loginAndSubmitButton != null
      ? ({
          mode: "create",
          submitButton: loginAndSubmitButton,
        } as const)
      : ({
          mode: "edit",
        } as const);

  const areControlsVisible = watch("isControlsVisible");

  return (
    <>
      {/* TODO is calendar ref necessary? */}
      <div aria-hidden /* ref={calendarRef} */>
        <Calendar<ReservationNode>
          events={calendarEvents}
          begin={focusDate}
          onNavigate={(d: Date) => setValue("date", formatDate(d))}
          eventStyleGetter={(event) =>
            eventStyleGetter(event, filterNonNullable(userReservations?.map((n) => n?.pk)), !isReservationQuotaReached)
          }
          slotPropGetter={slotPropGetter}
          viewType={calendarViewType}
          onView={(n) => {
            if (n === "month" || n === "week" || n === "day") {
              setCalendarViewType(n);
            }
          }}
          showToolbar
          reservable={!isReservationQuotaReached}
          toolbarComponent={Toolbar}
          dateCellWrapperComponent={TouchCellWrapper}
          resizable={!isReservationQuotaReached}
          // NOTE there was logic here to disable dragging on mobile
          // it breaks SSR render because it swaps the whole Calendar component
          draggable
          onSelectSlot={handleSlotClick}
          onEventDrop={handleCalendarEventChange}
          onEventResize={handleCalendarEventChange}
          onSelecting={handleCalendarEventChange}
          draggableAccessor={({ event }) => event?.state?.toString() === "INITIAL"}
          resizableAccessor={({ event }) => event?.state?.toString() === "INITIAL"}
          step={30}
          timeslots={SLOTS_EVERY_HOUR}
          culture={locale}
          aria-hidden
          longPressThreshold={100}
        />
      </div>
      <CalendarFooter aria-live="polite" aria-expanded={areControlsVisible}>
        <ReservationCalendarControls
          {...controlProps}
          reservationUnit={reservationUnit}
          reservationForm={reservationForm}
          durationOptions={durationOptions}
          focusSlot={focusSlot}
          startingTimeOptions={startingTimeOptions}
          submitReservation={submitReservation}
        />
      </CalendarFooter>
      <Legend />
    </>
  );
}

// TODO this could be narrowed down
// (requires rethinking the utility functions to reduce the amount of fragments)
export const RESERVATION_TIME_PICKER_FRAGMENT = gql`
  fragment ReservationTimePickerFields on ReservationUnitNode {
    id
    pk
    ...IsReservableFields
    ...PriceReservationUnitFields
    applicationRounds(ongoing: true) {
      id
      reservationPeriodBeginDate
      reservationPeriodEndDate
    }
  }
`;
