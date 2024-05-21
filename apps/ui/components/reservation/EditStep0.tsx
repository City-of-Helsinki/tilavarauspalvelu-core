import Calendar, { CalendarEvent } from "common/src/calendar/Calendar";
import {
  getEventBuffers,
  getNewReservation,
  getSlotPropGetter,
  getTimeslots,
} from "common/src/calendar/util";
import { breakpoints } from "common/src/common/style";
import type { PendingReservation } from "common/types/common";
import type {
  ApplicationRoundFieldsFragment,
  ListReservationsQuery,
  ReservationNode,
  ReservationQuery,
  ReservationUnitPageQuery,
} from "@gql/gql-types";
import { addMinutes, addSeconds, differenceInMinutes } from "date-fns";
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
  canReservationTimeBeChanged,
  getDurationOptions,
  isReservationReservable,
} from "@/modules/reservation";
import {
  getPossibleTimesForDay,
  getReservationUnitPrice,
  getTimeString,
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
  setErrorMsg,
  nextStep,
  isLoading,
}: Props): JSX.Element {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");

  const [shouldCalendarControlsBeVisible, setShouldCalendarControlsBeVisible] =
    useState(false);

  const originalBegin = new Date(reservation.begin);
  const originalEnd = new Date(reservation.end);

  const { watch, handleSubmit, setValue, formState } = reservationForm;
  const { isDirty } = formState;

  const [focusDate, setFocusDate] = useState<Date>(originalBegin);

  const isSlotAvailable = useCallback(
    (start: Date, end: Date, skipLengthCheck = false): boolean => {
      const resUnit = getWithoutThisReservation(reservationUnit, reservation);
      return isReservationReservable({
        reservationUnit: resUnit,
        activeApplicationRounds,
        start,
        end,
        skipLengthCheck,
      });
    },
    [reservationUnit, reservation, activeApplicationRounds]
  );

  const durationOptions = getDurationOptions(reservationUnit, t);

  const reservableTimeSpans = filterNonNullable(
    reservationUnit?.reservableTimeSpans
  );

  const duration =
    watch("duration") ?? differenceInMinutes(originalBegin, originalEnd);
  const startingTimeOptions = getPossibleTimesForDay(
    reservableTimeSpans,
    reservationUnit?.reservationStartInterval,
    fromUIDate(watch("date") ?? "") ?? new Date(),
    reservationUnit,
    activeApplicationRounds,
    duration
  );

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
        title: `${
          n.state === "CANCELLED"
            ? `${t("reservationCalendar:prefixForCancelled")}: `
            : suffix
        }`,
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

  const isSlotFree = useCallback(
    (start: Date): boolean => {
      const price = getReservationUnitPrice({
        reservationUnit,
        pricingDate: start,
        asNumeral: true,
      });
      return price === "0";
    },
    [reservationUnit]
  );

  const slotPropGetter = useMemo(() => {
    if (!reservationUnit) {
      return undefined;
    }
    return getSlotPropGetter({
      reservableTimeSpans,
      activeApplicationRounds,
      reservationBegins: reservationUnit.reservationBegins
        ? new Date(reservationUnit.reservationBegins)
        : undefined,
      reservationEnds: reservationUnit.reservationEnds
        ? new Date(reservationUnit.reservationEnds)
        : undefined,
      reservationsMinDaysBefore: reservationUnit.reservationsMinDaysBefore ?? 0,
      reservationsMaxDaysBefore: reservationUnit.reservationsMaxDaysBefore ?? 0,
      customValidation: (date) => isSlotFree(date),
    });
  }, [
    activeApplicationRounds,
    reservationUnit,
    isSlotFree,
    reservableTimeSpans,
  ]);

  // TODO submit should be completely unnecessary
  // just disable nextStep button if the form is invalid
  // the form isn't submitted from this step at all
  const submitReservation = (_data: PendingReservationFormType) => {
    if (!focusSlot?.start || !focusSlot?.end) {
      return;
    }
    const newReservation: PendingReservation = {
      begin: focusSlot.start.toISOString(),
      end: focusSlot.end.toISOString(),
      price: getReservationUnitPrice({
        reservationUnit,
        pricingDate: focusSlot?.start ? new Date(focusSlot.start) : undefined,
        minutes: 0,
        asNumeral: true,
      }),
    };

    const resUnit = getWithoutThisReservation(reservationUnit, reservation);

    const [isNewReservationValid, validationError] =
      canReservationTimeBeChanged({
        reservation,
        newReservation,
        reservationUnit: resUnit,
        activeApplicationRounds,
      });

    if (validationError) {
      setErrorMsg(t(`reservations:modifyTimeReasons.${validationError}`));
    } else if (isNewReservationValid) {
      nextStep();
    }
  };

  const handleCalendarEventChange = useCallback(
    (
      { start, end }: CalendarEvent<ReservationNode>,
      skipLengthCheck = false
    ): boolean => {
      if (!isSlotAvailable(start, end, skipLengthCheck)) {
        return false;
      }

      const newReservation = getNewReservation({ start, end, reservationUnit });
      const newDate = toUIDate(new Date(newReservation.begin));
      const newTime = getTimeString(new Date(newReservation.begin));
      setValue("date", newDate, { shouldDirty: true });
      setValue("time", newTime, { shouldDirty: true });
      setValue("duration", differenceInMinutes(end, start), {
        shouldDirty: true,
      });

      const isClientATouchDevice = isTouchDevice();
      if (isClientATouchDevice) {
        setShouldCalendarControlsBeVisible(true);
      }

      return true;
    },
    [isSlotAvailable, reservationUnit, setValue]
  );

  // FIXME some issues still moving a reservation (requires multiple clicks at times)
  const handleSlotClick = useCallback(
    (
      {
        start,
        end,
        action,
      }: { start: Date; end: Date; action: "select" | "click" | "doubleClick" },
      skipLengthCheck = false
    ): boolean => {
      const isClientATouchDevice = isTouchDevice();
      const isTouchClick = action === "select" && isClientATouchDevice;

      if (action === "select" && !isClientATouchDevice) {
        return false;
      }

      const normalizedEnd =
        action === "click" ||
        (isTouchClick && differenceInMinutes(end, start) <= 30)
          ? addSeconds(start, reservationUnit?.minReservationDuration ?? 0)
          : new Date(end);

      const newReservation = getNewReservation({
        start,
        end: normalizedEnd,
        reservationUnit,
      });

      if (!isSlotAvailable(start, end, skipLengthCheck)) {
        return false;
      }

      const newDate = toUIDate(new Date(newReservation.begin));
      const newTime = getTimeString(new Date(newReservation.begin));
      // click doesn't change the duration
      setValue("date", newDate, { shouldDirty: true });
      setValue("time", newTime, { shouldDirty: true });

      return true;
    },
    [reservationUnit, isSlotAvailable, setValue]
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
            onSelecting={(event) => handleCalendarEventChange(event, true)}
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
              event?.state.toString() === "INITIAL"
            }
            resizableAccessor={({ event }) =>
              event?.state.toString() === "INITIAL"
            }
            step={30}
            timeslots={getTimeslots(reservationUnit.reservationStartInterval)}
            culture={getLocalizationLang(i18n.language)}
            aria-hidden
            longPressThreshold={100}
          />
        </div>
        <CalendarFooter>
          <ReservationCalendarControls
            reservationUnit={reservationUnit}
            mode="edit"
            shouldCalendarControlsBeVisible={shouldCalendarControlsBeVisible}
            setShouldCalendarControlsBeVisible={
              setShouldCalendarControlsBeVisible
            }
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
