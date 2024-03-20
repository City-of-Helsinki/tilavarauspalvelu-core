import Calendar, { CalendarEvent } from "common/src/calendar/Calendar";
import {
  getEventBuffers,
  getNewReservation,
  getSlotPropGetter,
  getTimeslots,
} from "common/src/calendar/util";
import { breakpoints } from "common/src/common/style";
import type { PendingReservation } from "common/types/common";
import {
  ApplicationRoundNode,
  ReservationType,
  ReservationUnitType,
} from "common/types/gql-types";
import {
  addHours,
  addMinutes,
  addSeconds,
  differenceInMinutes,
  startOfDay,
} from "date-fns";
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
import { useForm } from "react-hook-form";
import {
  PendingReservationFormSchema,
  PendingReservationFormType,
} from "@/components/reservation-unit/schema";
import { zodResolver } from "@hookform/resolvers/zod";

type Props = {
  reservation: ReservationType;
  reservationUnit: ReservationUnitType;
  userReservations: ReservationType[];
  initialReservation: PendingReservation | null;
  setInitialReservation: React.Dispatch<
    React.SetStateAction<PendingReservation | null>
  >;
  activeApplicationRounds: ApplicationRoundNode[];
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

const EditStep0 = ({
  reservation,
  reservationUnit,
  userReservations,
  initialReservation,
  setInitialReservation,
  activeApplicationRounds,
  setErrorMsg,
  nextStep,
  isLoading,
}: Props): JSX.Element => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");

  const isClientATouchDevice = isTouchDevice();
  const [shouldCalendarControlsBeVisible, setShouldCalendarControlsBeVisible] =
    useState(false);
  const startDate = useMemo(
    () => new Date(reservation.begin),
    [reservation.begin]
  );
  const reservationForm = useForm<PendingReservationFormType>({
    defaultValues: {
      date: reservation.begin,
      duration: differenceInMinutes(startDate, new Date(reservation.end ?? "")),
      time: getTimeString(startDate),
    },
    mode: "onChange",
    resolver: zodResolver(PendingReservationFormSchema),
  });
  const { watch, setValue, handleSubmit } = reservationForm;
  const durationValue =
    watch("duration") ??
    differenceInMinutes(startDate, new Date(reservation.end));
  const focusDate = useMemo(
    () => new Date(watch("date") ?? initialReservation?.begin ?? startDate),
    [watch, startDate, initialReservation?.begin]
  );
  const timeValue =
    watch("time") ?? initialReservation?.begin
      ? getTimeString(new Date(initialReservation?.begin ?? ""))
      : getTimeString(startDate);
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
    const [isNewReservationValid, validationError] =
      canReservationTimeBeChanged({
        reservation,
        newReservation,
        reservationUnit: normalizedReservationUnit,
        activeApplicationRounds,
      });

    if (validationError) {
      setErrorMsg(t(`reservations:modifyTimeReasons.${validationError}`));
    } else if (isNewReservationValid) {
      nextStep();
    }
  };
  const isSlotReservable = useCallback(
    (start: Date, end: Date, skipLengthCheck = false): boolean => {
      return (
        reservationUnit != null &&
        isReservationReservable({
          reservationUnit,
          activeApplicationRounds,
          start,
          end,
          skipLengthCheck,
        })
      );
    },
    [activeApplicationRounds, reservationUnit]
  );
  const focusSlot: FocusTimeSlot = useMemo(() => {
    const start = focusDate;
    const [hours, minutes] = timeValue.split(":").map(Number);
    start.setHours(hours, minutes, 0, 0);
    const end = addMinutes(start, durationValue);
    return {
      start,
      end,
      isReservable: isSlotReservable(start, end),
      durationMinutes: durationValue,
    };
  }, [focusDate, durationValue, isSlotReservable, timeValue]);
  const durationOptions = useMemo(() => {
    const {
      minReservationDuration,
      maxReservationDuration,
      reservationStartInterval,
    } = reservationUnit || {};
    if (
      minReservationDuration == null ||
      maxReservationDuration == null ||
      reservationStartInterval == null
    ) {
      return [];
    }
    return getDurationOptions(
      minReservationDuration ?? undefined,
      maxReservationDuration ?? undefined,
      reservationStartInterval ?? 0,
      t
    );
  }, [reservationUnit, t]);
  const reservableTimeSpans = useMemo(
    () => filterNonNullable(reservationUnit?.reservableTimeSpans),
    [reservationUnit?.reservableTimeSpans]
  );
  const startingTimeOptions = useMemo(() => {
    return getPossibleTimesForDay(
      reservableTimeSpans,
      reservationUnit?.reservationStartInterval,
      focusDate
    )
      .filter((span) => {
        const [slotH, slotM] = span.split(":").map(Number);
        const slotDate = new Date(focusDate);
        slotDate.setHours(slotH, slotM, 0, 0);
        return (
          slotDate >= now &&
          isSlotReservable(slotDate, addMinutes(slotDate, durationValue))
        );
      })
      .map((span) => ({
        label: span,
        value: span,
      }));
  }, [
    focusDate,
    reservableTimeSpans,
    reservationUnit?.reservationStartInterval,
    now,
    durationValue,
    isSlotReservable,
  ]);
  const calendarEvents: CalendarEvent<ReservationType>[] = useMemo(() => {
    const diff = focusSlot?.durationMinutes ?? 0;
    const duration = diff >= 90 ? `(${formatDuration(diff, t)})` : "";
    const shownReservation =
      focusSlot != null
        ? { begin: focusSlot.start, end: focusSlot.end, state: "INITIAL" }
        : {
            begin: reservation.begin,
            end: reservation.end,
            state: "OWN",
          };
    const reservations =
      (focusSlot?.start
        ? reservationUnit?.reservations?.filter((n) => n?.pk !== reservation.pk)
        : reservationUnit?.reservations) ?? [];
    if (userReservations && reservationUnit?.reservations) {
      return [...reservations, shownReservation]
        .filter((n): n is NonNullable<typeof n> => n != null)
        .map((n) => {
          const suffix = n.state === "INITIAL" ? duration : "";
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

          return event as CalendarEvent<ReservationType>;
        });
    }
    return [];
  }, [
    reservationUnit,
    t,
    focusSlot,
    userReservations,
    reservation.pk,
    reservation.begin,
    reservation.end,
  ]);

  // Why are we modifying the reservation unit, instead of splitting the reservations out
  // and filtering that list
  const normalizedReservationUnit = useMemo(() => {
    return {
      ...reservationUnit,
      reservations: reservationUnit.reservations?.filter(
        (n) => n?.pk !== reservation.pk
      ),
    };
  }, [reservation.pk, reservationUnit]);

  const eventBuffers = useMemo(() => {
    // TODO refactor
    // backend sends 0 => front shows 30 min buffer, so has to be undefined
    // if reservation buffers !== reservationUnit buffers, we want the to show the reservation buffers till user edits the reservation
    const reservationBufferTimeBefore =
      reservation?.bufferTimeBefore != null &&
      reservation.bufferTimeBefore !== 0
        ? reservation?.bufferTimeBefore.toString()
        : undefined;
    const reservationBufferTimeAfter =
      reservation?.bufferTimeAfter != null && reservation.bufferTimeAfter !== 0
        ? reservation?.bufferTimeAfter.toString()
        : undefined;

    const bufferTimeBefore =
      reservationUnit?.bufferTimeBefore != null &&
      reservationUnit.bufferTimeBefore !== 0
        ? reservationUnit?.bufferTimeBefore.toString()
        : reservationBufferTimeBefore;
    const bufferTimeAfter =
      reservationUnit?.bufferTimeAfter != null &&
      reservationUnit.bufferTimeAfter !== 0
        ? reservationUnit?.bufferTimeAfter.toString()
        : reservationBufferTimeAfter;

    return getEventBuffers([
      ...(calendarEvents.flatMap((e) => e.event) as ReservationType[]),
      {
        begin: focusSlot?.start.toISOString() || reservation.begin,
        end: focusSlot?.end.toISOString() || reservation.end,
        bufferTimeBefore:
          focusSlot != null ? bufferTimeBefore : reservationBufferTimeBefore,
        bufferTimeAfter:
          focusSlot != null ? bufferTimeAfter : reservationBufferTimeAfter,
      },
    ]);
  }, [
    calendarEvents,
    focusSlot,
    reservation.begin,
    reservation.end,
    reservation?.bufferTimeAfter,
    reservation?.bufferTimeBefore,
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

  const handleEventChange = useCallback(
    (
      { start, end }: CalendarEvent<ReservationType>,
      skipLengthCheck = false
    ): boolean => {
      const newReservation = getNewReservation({ start, end, reservationUnit });

      if (!isSlotReservable(start, end, skipLengthCheck)) {
        return false;
      }

      setInitialReservation(newReservation);

      if (isClientATouchDevice) {
        setShouldCalendarControlsBeVisible(true);
      }

      return true;
    },
    [
      isClientATouchDevice,
      setInitialReservation,
      isSlotReservable,
      reservationUnit,
    ]
  );

  const handleSlotClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO type calendar props
    ({ start, end, action }: any, skipLengthCheck = false): boolean => {
      const isTouchClick = action === "select" && isClientATouchDevice;

      if (action === "select" && !isClientATouchDevice) {
        return false;
      }

      const normalizedEnd =
        action === "click" ||
        (isTouchClick && differenceInMinutes(end, start) <= 30)
          ? addSeconds(
              new Date(start),
              reservationUnit.minReservationDuration || 0
            )
          : new Date(end);

      const newReservation = getNewReservation({
        start,
        end: normalizedEnd,
        reservationUnit,
      });

      if (
        !isSlotReservable(start, new Date(newReservation.end), skipLengthCheck)
      ) {
        return false;
      }

      setInitialReservation(newReservation);

      return true;
    },
    [
      isClientATouchDevice,
      isSlotReservable,
      reservationUnit,
      setInitialReservation,
    ]
  );

  const currentDate = focusDate || new Date();
  const dayStartTime = addHours(startOfDay(currentDate), 6);
  const events = [...calendarEvents, ...eventBuffers];

  return (
    <>
      <CalendarWrapper>
        <div aria-hidden>
          <Calendar<ReservationType>
            events={events}
            begin={currentDate}
            onNavigate={(d: Date) => setValue("date", d.toISOString())}
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
            onSelecting={(event) => handleEventChange(event, true)}
            min={dayStartTime}
            showToolbar
            reservable
            toolbarComponent={Toolbar}
            dateCellWrapperComponent={TouchCellWrapper}
            eventWrapperComponent={EventWrapperComponent}
            resizable
            draggable={!isClientATouchDevice}
            onEventDrop={handleEventChange}
            onEventResize={handleEventChange}
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
            focusSlot={focusSlot}
            startingTimeOptions={startingTimeOptions}
            submitReservation={submitReservation}
          />
        </CalendarFooter>
        <Legend />
      </CalendarWrapper>
      <Actions>
        <form noValidate onSubmit={handleSubmit(submitReservation)}>
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
            disabled={!focusSlot.isReservable}
            type="submit"
            data-testid="reservation-edit__button--continue"
            isLoading={isLoading}
            loadingText={t("reservationCalendar:nextStepLoading")}
          >
            {t("reservationCalendar:nextStep")}
          </MediumButton>
        </form>
      </Actions>
    </>
  );
};

export default EditStep0;
