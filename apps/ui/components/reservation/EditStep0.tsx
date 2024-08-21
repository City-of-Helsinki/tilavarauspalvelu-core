import Calendar, {
  type CalendarEvent,
  type SlotClickProps,
} from "common/src/calendar/Calendar";
import { getEventBuffers } from "common/src/calendar/util";
import { breakpoints } from "common/src/common/style";
import type { PendingReservation } from "@/modules/types";
import type {
  ApplicationRoundFieldsFragment,
  ListReservationsQuery,
  ReservationNode,
  ReservationQuery,
  ReservationUnitPageQuery,
} from "@gql/gql-types";
import { addMinutes, differenceInMinutes } from "date-fns";
import classNames from "classnames";
import { IconArrowRight, IconCross } from "hds-react";
import { useRouter } from "next/router";
import React, { Children, useCallback, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import { useMedia } from "react-use";
import styled from "styled-components";
import { Toolbar } from "common/src/calendar/Toolbar";
import { filterNonNullable, getLocalizationLang } from "common/src/helpers";
import {
  SLOTS_EVERY_HOUR,
  canReservationTimeBeChanged,
  getDurationOptions,
  getNewReservation,
} from "@/modules/reservation";
import {
  getBoundCheckedReservation,
  getSlotPropGetter,
  isRangeReservable,
} from "@/modules/reservable";
import {
  getPossibleTimesForDay,
  getReservationUnitPrice,
  getTimeString,
  isReservationUnitPaid,
} from "@/modules/reservationUnit";
import { formatDuration, isTouchDevice } from "@/modules/util";
import { BlackButton, MediumButton } from "@/styles/util";
import Legend from "../calendar/Legend";
import ReservationCalendarControls, {
  FocusTimeSlot,
} from "../calendar/ReservationCalendarControls";
import { CalendarWrapper } from "../reservation-unit/ReservationUnitStyles";
import { eventStyleGetter } from "@/components/common/calendarUtils";
import { type UseFormReturn } from "react-hook-form";
import { type PendingReservationFormType } from "@/components/reservation-unit/schema";
import { fromUIDate, isValidDate, toUIDate } from "common/src/common/util";
import { useReservableTimes } from "@/hooks/useReservableTimes";

type QueryData = NonNullable<ListReservationsQuery["reservations"]>;
type Node = NonNullable<
  NonNullable<NonNullable<QueryData["edges"]>[0]>["node"]
>;
type ReservationUnitNodeT = NonNullable<
  ReservationUnitPageQuery["reservationUnit"]
>;
type ReservationNodeT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: ReservationNodeT;
  reservationUnit: ReservationUnitNodeT;
  userReservations: Node[];
  reservationForm: UseFormReturn<PendingReservationFormType>;
  activeApplicationRounds: ApplicationRoundFieldsFragment[];
  setErrorMsg: React.Dispatch<React.SetStateAction<string | null>>;
  nextStep: () => void;
  apiBaseUrl: string;
  isLoading: boolean;
};

type WeekOptions = "day" | "week" | "month";

const CalendarFooter = styled.div`
  position: sticky;
  bottom: 0;
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

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    flex-direction: row;
  }
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO type calendar props
const EventWrapperComponent = (props: any): JSX.Element => {
  const { event } = props;
  let isSmall = false;
  let isMedium = false;
  if (event.event.state === "INITIAL") {
    const { start, end } = props.event;
    const diff = differenceInMinutes(end, start);
    if (diff <= 30) isSmall = true;
    if (diff <= 120) isMedium = true;
  }
  return <div {...props} className={classNames({ isSmall, isMedium })} />;
};

const TouchCellWrapper = ({
  children,
  value,
  onSelectSlot,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO type calendar props
any): JSX.Element => {
  return React.cloneElement(Children.only(children), {
    onTouchEnd: () => onSelectSlot({ action: "click", slots: [value] }),
    style: {
      className: `${children}`,
    },
  });
};

/// To check availability for the reservation.
/// The check functions use the reservationUnit instead of a list of other reservations
/// so have to do some questionable edits.
function getWithoutThisReservation(
  reservationUnit: ReservationUnitNodeT,
  reservation: ReservationNodeT
): ReservationUnitNodeT {
  const otherReservations = filterNonNullable(
    reservationUnit?.reservationSet?.filter((n) => n?.pk !== reservation.pk)
  );
  return {
    ...reservationUnit,
    reservationSet: otherReservations,
  };
}

function calculateFocusSlot(
  date: string,
  timeValue: string,
  durationMinutes: number
): Omit<FocusTimeSlot, "isReservable"> {
  if (!timeValue) {
    throw new Error("Invalid time value");
  }
  const [hours, minutes] = timeValue
    .split(":")
    .map(Number)
    .filter(Number.isFinite);
  if (hours == null || minutes == null) {
    throw new Error("Invalid time value");
  }
  const start = fromUIDate(date) ?? new Date();
  if (!isValidDate(start)) {
    throw new Error("Invalid date value");
  }
  start.setHours(hours, minutes, 0, 0);
  const end = addMinutes(start, durationMinutes);

  return {
    start,
    end,
    durationMinutes,
  };
}

export function EditStep0({
  reservation,
  reservationUnit,
  userReservations,
  activeApplicationRounds,
  reservationForm,
  nextStep,
  isLoading,
}: Props): JSX.Element {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");

  const originalBegin = new Date(reservation.begin);
  const originalEnd = new Date(reservation.end);

  const { watch, handleSubmit, setValue, formState } = reservationForm;
  const { isDirty } = formState;

  const [focusDate, setFocusDate] = useState<Date>(originalBegin);
  const reservableTimes = useReservableTimes(reservationUnit);

  const isSlotAvailable = useCallback(
    (start: Date, end: Date): boolean => {
      const resUnit = getWithoutThisReservation(reservationUnit, reservation);
      return isRangeReservable({
        range: {
          start,
          end,
        },
        reservationUnit: resUnit,
        reservableTimes,
        activeApplicationRounds,
      });
    },
    [reservationUnit, reservableTimes, reservation, activeApplicationRounds]
  );

  const durationOptions = getDurationOptions(reservationUnit, t);

  const duration =
    watch("duration") ?? differenceInMinutes(originalBegin, originalEnd);
  const startingTimeOptions = getPossibleTimesForDay({
    reservableTimes,
    interval: reservationUnit?.reservationStartInterval,
    date: fromUIDate(watch("date") ?? "") ?? new Date(),
    reservationUnit,
    activeApplicationRounds,
    durationValue: duration,
  });

  const focusSlot = calculateFocusSlot(
    watch("date") ?? "",
    watch("time") ?? "",
    duration
  );
  const isReservable = isSlotAvailable(focusSlot.start, focusSlot.end);

  const calendarEvents: CalendarEvent<ReservationNode>[] = useMemo(() => {
    const diff = focusSlot.durationMinutes ?? 0;
    const dur = diff >= 90 ? `(${formatDuration(diff, t)})` : "";
    // TODO show different style if the reservation has not been modified
    const currentReservation = {
      begin: focusSlot.start,
      end: focusSlot.end,
      state: "INITIAL",
    };
    const resUnit = getWithoutThisReservation(reservationUnit, reservation);
    const otherReservations = filterNonNullable(resUnit.reservationSet);
    return [...otherReservations, currentReservation].map((n) => {
      const suffix = n.state === "INITIAL" ? dur : "";
      const event = {
        title:
          n.state === "CANCELLED"
            ? `${t("reservationCalendar:prefixForCancelled")}: `
            : suffix,
        start: n.begin ? new Date(n.begin) : new Date(),
        end: n.end ? new Date(n.end) : new Date(),
        allDay: false,
        event: n,
      };

      return event as CalendarEvent<ReservationNode>;
    });
  }, [reservationUnit, t, focusSlot, reservation]);

  const eventBuffers = useMemo(() => {
    const bufferTimeBefore = reservationUnit.bufferTimeBefore ?? 0;
    const bufferTimeAfter = reservationUnit.bufferTimeAfter ?? 0;

    return getEventBuffers([
      ...(calendarEvents.flatMap((e) => e.event) as ReservationNode[]),
      {
        begin: focusSlot.start.toISOString(),
        end: focusSlot.end.toISOString(),
        bufferTimeBefore,
        bufferTimeAfter,
      },
    ]);
  }, [
    calendarEvents,
    focusSlot,
    reservationUnit?.bufferTimeAfter,
    reservationUnit?.bufferTimeBefore,
  ]);

  const slotPropGetter = useMemo(() => {
    if (!reservationUnit) {
      return undefined;
    }
    const isSlotFree = (start: Date): boolean => {
      return isReservationUnitPaid(reservationUnit.pricings, start);
    };

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
      customValidation: isSlotFree,
    });
  }, [activeApplicationRounds, reservationUnit, reservableTimes]);

  // TODO submit should be completely unnecessary
  // just disable nextStep button if the form is invalid
  // the form isn't submitted from this step at all
  const submitReservation = (_data: PendingReservationFormType) => {
    if (!focusSlot?.start || !focusSlot?.end) {
      return;
    }
    const { start } = focusSlot;
    const isFree = isReservationUnitPaid(reservationUnit.pricings, start);
    const newReservation: PendingReservation = {
      begin: focusSlot.start.toISOString(),
      end: focusSlot.end.toISOString(),
      price: isFree
        ? "0"
        : (getReservationUnitPrice({
            reservationUnit,
            pricingDate: focusSlot.start,
            minutes: 0,
          }) ?? undefined),
    };

    const resUnit = getWithoutThisReservation(reservationUnit, reservation);

    const isNewReservationValid = canReservationTimeBeChanged({
      reservation,
      newReservation,
      reservableTimes,
      reservationUnit: resUnit,
      activeApplicationRounds,
    });

    /*
    if (validationError) {
      setErrorMsg(t(`reservations:modifyTimeReasons.${validationError}`));
    }
    */
    if (isNewReservationValid) {
      nextStep();
    }
  };

  const handleCalendarEventChange = useCallback(
    ({ start, end }: CalendarEvent<ReservationNode>): boolean => {
      const { start: newStart, end: newEnd } =
        getBoundCheckedReservation({
          start,
          end,
          reservationUnit,
          durationOptions,
        }) ?? {};

      if (newStart == null || newEnd == null) {
        return false;
      }

      if (!isSlotAvailable(newStart, newEnd)) {
        return false;
      }

      const { begin } = getNewReservation({
        start: newStart,
        end: newEnd,
        reservationUnit,
      });
      const newDate = toUIDate(begin);
      const newTime = getTimeString(begin);
      setValue("date", newDate, { shouldDirty: true });
      setValue("time", newTime, { shouldDirty: true });
      setValue("duration", differenceInMinutes(newEnd, newStart), {
        shouldDirty: true,
      });

      const isClientATouchDevice = isTouchDevice();
      if (isClientATouchDevice) {
        // TODO test: does setValue work?
        setValue("isControlsVisible", true);
      }

      return true;
    },
    [isSlotAvailable, reservationUnit, setValue, durationOptions]
  );

  // compared to handleDragEvent, this doesn't allow changing the duration (only the start time)
  // if the duration is not possible, the event is not moved
  const handleSlotClick = useCallback(
    (props: SlotClickProps): boolean => {
      const { start, end, action } = props;
      // const isTouchClick = action === "select" && isClientATouchDevice;

      // why?
      if (action === "select" && !isTouchDevice()) {
        return false;
      }

      // need to check the start time is valid
      // ignore end time because the duration is fixed
      const { start: newStart } =
        getBoundCheckedReservation({
          start,
          end,
          reservationUnit,
          durationOptions,
        }) ?? {};

      if (newStart == null) {
        return false;
      }

      // onClick should not change the duration
      const realEnd = addMinutes(newStart, duration);
      if (!isSlotAvailable(newStart, realEnd)) {
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
    },
    [reservationUnit, isSlotAvailable, setValue, durationOptions, duration]
  );

  const events = [...calendarEvents, ...eventBuffers];

  return (
    <>
      <CalendarWrapper>
        <div aria-hidden>
          <Calendar<ReservationNode>
            events={events}
            begin={focusDate}
            // TODO should not set the reservation date, but a separate focus date
            onNavigate={(d: Date) => setFocusDate(d)}
            eventStyleGetter={(event) =>
              eventStyleGetter(
                event,
                filterNonNullable(userReservations?.map((n) => n?.pk))
              )
            }
            slotPropGetter={slotPropGetter}
            viewType={calendarViewType}
            onView={(str) => {
              if (str === "month" || str === "week" || str === "day") {
                setCalendarViewType(str);
              }
            }}
            onSelecting={handleCalendarEventChange}
            // TODO what is the purpose of this?
            // min={addHours(startOfDay(focusDate), 6)}
            showToolbar
            reservable
            toolbarComponent={Toolbar}
            dateCellWrapperComponent={TouchCellWrapper}
            eventWrapperComponent={EventWrapperComponent}
            resizable
            draggable={!isTouchDevice()}
            onEventDrop={handleCalendarEventChange}
            onEventResize={handleCalendarEventChange}
            onSelectSlot={handleSlotClick}
            draggableAccessor={({ event }) =>
              event?.state ? event?.state?.toString() === "INITIAL" : false
            }
            resizableAccessor={({ event }) =>
              event?.state ? event?.state?.toString() === "INITIAL" : false
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
            mode="edit"
            isAnimated={isMobile}
            reservationForm={reservationForm}
            durationOptions={durationOptions}
            focusSlot={{ ...focusSlot, isReservable }}
            startingTimeOptions={startingTimeOptions}
            submitReservation={submitReservation}
          />
        </CalendarFooter>
        <Legend />
      </CalendarWrapper>
      <form noValidate onSubmit={handleSubmit(submitReservation)}>
        <Actions>
          <BlackButton
            type="button"
            variant="secondary"
            iconLeft={<IconCross aria-hidden />}
            onClick={() => {
              router.push(`/reservations/${reservation.pk}`);
            }}
            data-testid="reservation-edit__button--cancel"
          >
            {t("reservations:cancelEditReservationTime")}
          </BlackButton>
          <MediumButton
            variant="primary"
            iconRight={<IconArrowRight aria-hidden />}
            disabled={!isReservable || !isDirty}
            type="submit"
            data-testid="reservation-edit__button--continue"
            isLoading={isLoading}
            loadingText={t("reservationCalendar:nextStepLoading")}
          >
            {t("reservationCalendar:nextStep")}
          </MediumButton>
        </Actions>
      </form>
    </>
  );
}
