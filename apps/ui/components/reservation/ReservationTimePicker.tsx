import React, { Children, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import {
  ReservationNode,
  ReservationTypeChoice,
  ReservationUnitPageQuery,
  useListReservationsQuery,
} from "@/gql/gql-types";
import styled from "styled-components";
import Calendar, {
  type SlotClickProps,
  type CalendarEvent,
  SlotProps,
} from "common/src/calendar/Calendar";
import { Toolbar } from "common/src/calendar/Toolbar";
import { addMinutes, differenceInMinutes } from "date-fns";
import { eventStyleGetter } from "@/components/common/calendarUtils";
import { Legend } from "@/components/calendar/Legend";
import { useMedia } from "react-use";
import { breakpoints } from "common/src/common/style";
import { getEventBuffers } from "common/src/calendar/util";
import { filterNonNullable, getLocalizationLang } from "common/src/helpers";
import {
  SLOTS_EVERY_HOUR,
  convertFormToFocustimeSlot,
  getDurationOptions,
  getNewReservation,
} from "@/modules/reservation";
import {
  ReservableMap,
  RoundPeriod,
  getBoundCheckedReservation,
  getSlotPropGetter,
  isRangeReservable,
} from "@/modules/reservable";
import {
  formatDuration,
  fromUIDate,
  toApiDate,
  toUIDate,
} from "common/src/common/util";
import { useTranslation } from "next-i18next";
import { ReservationCalendarControls } from "../calendar/ReservationCalendarControls";
import { PendingReservation } from "@/modules/types";
import { isTouchDevice } from "@/modules/util";
import { getTimeString } from "@/modules/reservationUnit";
import { UseFormReturn } from "react-hook-form";
import { PendingReservationFormType } from "../reservation-unit/schema";
import { useCurrentUser } from "@/hooks/user";
import { RELATED_RESERVATION_STATES } from "common/src/const";

type WeekOptions = "day" | "week" | "month";

const EventWrapper = styled.div``;

function EventWrapperComponent({
  event,
  ...props
}: {
  event: CalendarEvent<ReservationNode>;
}) {
  let isSmall = false;
  let isMedium = false;
  // TODO don't override state enums with strings
  if (event.event?.state?.toString() === "INITIAL") {
    const { start, end } = event;
    const diff = differenceInMinutes(end, start);
    if (diff <= 30) isSmall = true;
    if (diff <= 120) isMedium = true;
  }
  return (
    <EventWrapper {...props} className={classNames({ isSmall, isMedium })} />
  );
}

function TouchCellWrapper({
  children,
  value,
  onSelectSlot,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO Calendar prop typing
any): JSX.Element {
  return React.cloneElement(Children.only(children), {
    onTouchEnd: () => onSelectSlot({ action: "click", slots: [value] }),
    style: {
      className: `${children}`,
    },
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

type Props = {
  reservationUnit: NonNullable<ReservationUnitPageQuery["reservationUnit"]>;
  reservableTimes: ReservableMap;
  activeApplicationRounds: readonly RoundPeriod[];
  reservationForm: UseFormReturn<PendingReservationFormType>;
  isReservationQuotaReached: boolean;
  submitReservation: (d: PendingReservationFormType) => void;
  // TODO replace with mode selector
  loginAndSubmitButton?: JSX.Element;
  startingTimeOptions: Array<{ value: string; label: string }>;
};

function useSlotPropGetter({
  reservableTimes,
  activeApplicationRounds,
  reservationUnit,
}: Pick<
  Props,
  "reservableTimes" | "activeApplicationRounds" | "reservationUnit"
>): (date: Date) => SlotProps {
  return useMemo(() => {
    return getSlotPropGetter({
      reservableTimes,
      activeApplicationRounds,
      reservationBegins: reservationUnit.reservationBegins
        ? new Date(reservationUnit.reservationBegins)
        : undefined,
      reservationEnds: reservationUnit.reservationEnds
        ? new Date(reservationUnit.reservationEnds)
        : undefined,
      reservationsMinDaysBefore: reservationUnit.reservationsMinDaysBefore ?? 0,
      reservationsMaxDaysBefore: reservationUnit.reservationsMaxDaysBefore ?? 0,
    });
  }, [
    reservableTimes,
    activeApplicationRounds,
    reservationUnit.reservationBegins,
    reservationUnit.reservationEnds,
    reservationUnit.reservationsMinDaysBefore,
    reservationUnit.reservationsMaxDaysBefore,
  ]);
}

function useCalendarEventChange({
  reservationUnit,
  focusSlot,
}: Pick<Props, "reservationUnit"> & {
  focusSlot: ReturnType<typeof convertFormToFocustimeSlot>;
}) {
  const { t } = useTranslation();
  // TODO this doesn't optimize anything
  // any change in the event will cause a full recalculation
  const calendarEvents: CalendarEvent<ReservationNode>[] = useMemo(() => {
    const existingReservations = filterNonNullable(
      reservationUnit.reservationSet
    );

    const shouldDisplayFocusSlot = focusSlot.isReservable;

    let focusEvent = null;
    if (shouldDisplayFocusSlot) {
      const { durationMinutes: diff, start, end } = focusSlot;
      focusEvent = {
        begin: start,
        end,
        state: "INITIAL",
        durationString: diff >= 90 ? `(${formatDuration(diff, t)})` : "",
      };
    }

    return [
      ...existingReservations,
      ...(focusEvent != null ? [focusEvent] : []),
    ].map((n) => {
      const suffix = n.state === "INITIAL" ? n.durationString : "";
      const event: CalendarEvent<ReservationNode> = {
        title:
          n.state === "CANCELLED"
            ? `${t("reservationCalendar:prefixForCancelled")}: `
            : suffix,
        start: new Date(n.begin ?? ""),
        end: new Date(n.end ?? ""),
        allDay: false,
        // TODO refactor and remove modifying the state
        event: n as ReservationNode,
      };

      return event;
    });
  }, [reservationUnit, t, focusSlot]);
  // TODO should be combined with calendar events
  const eventBuffers = useMemo(() => {
    const bufferTimeBefore = reservationUnit.bufferTimeBefore;
    const bufferTimeAfter = reservationUnit.bufferTimeAfter;
    const evts = filterNonNullable(calendarEvents.flatMap((e) => e.event));
    let pendingReservation: PendingReservation | null = null;
    if (focusSlot.isReservable) {
      pendingReservation = {
        begin: focusSlot.start.toISOString(),
        end: focusSlot.end.toISOString(),
        state: "INITIAL",
        bufferTimeBefore,
        bufferTimeAfter,
      };
    }
    return getEventBuffers([
      ...evts,
      // focusSlot has invalid reservations when the slot isn't properly selected
      // similar check is in calendarEvents
      ...(pendingReservation != null ? [pendingReservation] : []),
    ]);
  }, [calendarEvents, focusSlot, reservationUnit]);

  return [...calendarEvents, ...eventBuffers];
}

// FIXME handle this reservation if we are in edit mode (remove it from the other reservations)
export function ReservationTimePicker({
  reservationUnit,
  reservableTimes,
  activeApplicationRounds,
  reservationForm,
  isReservationQuotaReached,
  loginAndSubmitButton,
  submitReservation,
  startingTimeOptions,
}: Props) {
  const { t, i18n } = useTranslation();
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");
  const { watch, setValue } = reservationForm;

  const dateValue = watch("date");

  const now = useMemo(() => new Date(), []);
  const focusDate = fromUIDate(dateValue) ?? new Date();

  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);
  useEffect(() => {
    setCalendarViewType(isMobile ? "day" : "week");
  }, [isMobile]);

  const focusSlot = convertFormToFocustimeSlot({
    data: watch(),
    reservationUnit,
    activeApplicationRounds,
    reservableTimes,
  });

  const calendarEvents = useCalendarEventChange({
    reservationUnit,
    focusSlot,
  });
  const slotPropGetter = useSlotPropGetter({
    reservableTimes,
    activeApplicationRounds,
    reservationUnit,
  });

  // TODO should come from SSR
  const { currentUser } = useCurrentUser();

  const durationOptions = getDurationOptions(reservationUnit, t);

  const handleCalendarEventChange = ({
    start,
    end,
  }: CalendarEvent<ReservationNode>): boolean => {
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

    const newDate = toUIDate(begin);
    const newTime = getTimeString(begin);

    setValue("date", newDate, { shouldDirty: true });
    setValue("duration", duration, { shouldDirty: true });
    setValue("time", newTime, { shouldDirty: true });

    if (isTouchDevice()) {
      setValue("isControlsVisible", true, { shouldDirty: true });
    }

    return true;
  };

  // TODO combine the logic of this and the handleCalendarEventChange
  // compared to handleDragEvent, this doesn't allow changing the duration (only the start time)
  // if the duration is not possible, the event is not moved
  const handleSlotClick = (props: SlotClickProps): boolean => {
    const { start, end, action } = props;
    if (
      (action === "select" && !isTouchDevice()) ||
      isReservationQuotaReached
    ) {
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

    const uiDate = toUIDate(begin);
    const uiTime = getTimeString(begin);
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
      beginDate: toApiDate(now),
      user: currentUser?.pk ?? 0,
      reservationUnit: [reservationUnit.pk ?? 0],
      state: RELATED_RESERVATION_STATES,
      reservationType: ReservationTypeChoice.Normal,
    },
  });

  const userReservations = filterNonNullable(
    data?.reservations?.edges?.map((e) => e?.node)
  );

  return (
    <>
      {/* TODO is calendar ref necessary? */}
      <div aria-hidden /* ref={calendarRef} */>
        <Calendar<ReservationNode>
          events={calendarEvents}
          begin={focusDate}
          onNavigate={(d: Date) => setValue("date", toUIDate(d))}
          eventStyleGetter={(event) =>
            eventStyleGetter(
              event,
              filterNonNullable(userReservations?.map((n) => n?.pk)),
              !isReservationQuotaReached
            )
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
          // @ts-expect-error: FIXME: fix this
          eventWrapperComponent={EventWrapperComponent}
          resizable={!isReservationQuotaReached}
          // NOTE there was logic here to disable dragging on mobile
          // it breaks SSR render because it swaps the whole Calendar component
          draggable
          onSelectSlot={handleSlotClick}
          onEventDrop={handleCalendarEventChange}
          onEventResize={handleCalendarEventChange}
          onSelecting={handleCalendarEventChange}
          draggableAccessor={({ event }) =>
            event?.state?.toString() === "INITIAL"
          }
          resizableAccessor={({ event }) =>
            event?.state?.toString() === "INITIAL"
          }
          step={30}
          timeslots={SLOTS_EVERY_HOUR}
          culture={getLocalizationLang(i18n.language)}
          aria-hidden
          longPressThreshold={100}
        />
      </div>
      <CalendarFooter>
        <ReservationCalendarControls
          reservationUnit={reservationUnit}
          reservationForm={reservationForm}
          durationOptions={durationOptions}
          focusSlot={focusSlot}
          startingTimeOptions={startingTimeOptions}
          submitReservation={submitReservation}
          // FIXME typing doesn't work here (it's exclusive but ts can't infere it here)
          mode={loginAndSubmitButton != null ? "create" : "edit"}
          // @ts-expect-error: TODO: fix this
          LoginAndSubmit={loginAndSubmitButton}
        />
      </CalendarFooter>
      <Legend />
    </>
  );
}
