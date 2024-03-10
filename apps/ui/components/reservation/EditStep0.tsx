import Calendar, { CalendarEvent } from "common/src/calendar/Calendar";
import {
  getEventBuffers,
  getNewReservation,
  getSlotPropGetter,
  getTimeslots,
} from "common/src/calendar/util";
import { breakpoints } from "common/src/common/style";
import { parseDate } from "common/src/common/util";
import type { PendingReservation } from "common/types/common";
import {
  ApplicationRoundNode,
  ReservationType,
  ReservationUnitType,
} from "common/types/gql-types";
import {
  addHours,
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
  isReservationReservable,
} from "@/modules/reservation";
import { getReservationUnitPrice } from "@/modules/reservationUnit";
import { formatDuration, isTouchDevice } from "@/modules/util";
import { BlackButton, MediumButton } from "@/styles/util";
import Legend from "../calendar/Legend";
import ReservationCalendarControls from "../calendar/ReservationCalendarControls";
import { CalendarWrapper } from "../reservation-unit/ReservationUnitStyles";
import { eventStyleGetter } from "@/components/common/calendarUtils";

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
  apiBaseUrl,
  isLoading,
}: Props): JSX.Element => {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);

  const [focusDate, setFocusDate] = useState(new Date(reservation.begin));
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");

  const isClientATouchDevice = isTouchDevice();
  const [shouldCalendarControlsBeVisible, setShouldCalendarControlsBeVisible] =
    useState(false);

  const calendarEvents: CalendarEvent<ReservationType>[] = useMemo(() => {
    const maybeDiff =
      initialReservation != null
        ? differenceInMinutes(
            new Date(initialReservation.end),
            new Date(initialReservation.begin)
          )
        : undefined;
    const diff = maybeDiff ?? 0;
    const duration = diff >= 90 ? `(${formatDuration(diff, t)})` : "";
    const shownReservation =
      initialReservation != null
        ? { ...initialReservation, state: "INITIAL" }
        : {
            begin: reservation.begin,
            end: reservation.end,
            state: "OWN",
          };
    const reservations =
      (initialReservation?.begin
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
            start: n.begin ? parseDate(n.begin) : new Date(),
            end: n.end ? parseDate(n.end) : new Date(),
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
    initialReservation,
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
        begin: initialReservation?.begin || reservation.begin,
        end: initialReservation?.end || reservation.end,
        bufferTimeBefore:
          initialReservation != null
            ? bufferTimeBefore
            : reservationBufferTimeBefore,
        bufferTimeAfter:
          initialReservation != null
            ? bufferTimeAfter
            : reservationBufferTimeAfter,
      },
    ]);
  }, [
    calendarEvents,
    initialReservation,
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
    const reservableTimeSpans = filterNonNullable(
      reservationUnit.reservableTimeSpans
    );
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
  }, [activeApplicationRounds, reservationUnit, isSlotFree]);

  const isSlotReservable = useCallback(
    (start: Date, end: Date, skipLengthCheck = false): boolean => {
      return (
        isReservationReservable({
          reservationUnit: normalizedReservationUnit,
          activeApplicationRounds,
          start,
          end,
          skipLengthCheck,
        }) && isSlotFree(start)
      );
    },
    [activeApplicationRounds, isSlotFree, normalizedReservationUnit]
  );

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
            reservationUnit={normalizedReservationUnit}
            initialReservation={initialReservation}
            setInitialReservation={setInitialReservation}
            isSlotReservable={(startDate, endDate) =>
              isSlotReservable(startDate, endDate)
            }
            setCalendarFocusDate={setFocusDate}
            activeApplicationRounds={activeApplicationRounds}
            setErrorMsg={setErrorMsg}
            handleEventChange={handleEventChange}
            mode="edit"
            customAvailabilityValidation={isSlotFree}
            isReserving={false}
            shouldCalendarControlsBeVisible={shouldCalendarControlsBeVisible}
            setShouldCalendarControlsBeVisible={
              setShouldCalendarControlsBeVisible
            }
            apiBaseUrl={apiBaseUrl}
            isAnimated={isMobile}
          />
        </CalendarFooter>
        <Legend />
      </CalendarWrapper>
      <Actions>
        <BlackButton
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
          disabled={!initialReservation?.begin || !initialReservation?.end}
          onClick={() => {
            if (!initialReservation?.begin || !initialReservation?.end) {
              return;
            }
            const newReservation: PendingReservation = {
              ...initialReservation,
              price: getReservationUnitPrice({
                reservationUnit,
                pricingDate: initialReservation?.begin
                  ? new Date(initialReservation.begin)
                  : undefined,
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
              setErrorMsg(
                t(`reservations:modifyTimeReasons.${validationError}`)
              );
            } else if (isNewReservationValid) {
              nextStep();
            }
          }}
          data-testid="reservation-edit__button--continue"
          isLoading={isLoading}
          loadingText={t("reservationCalendar:nextStepLoading")}
        >
          {t("reservationCalendar:nextStep")}
        </MediumButton>
      </Actions>
    </>
  );
};

export default EditStep0;
