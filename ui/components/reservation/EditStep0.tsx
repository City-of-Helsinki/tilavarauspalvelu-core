import Calendar, { CalendarEvent } from "common/src/calendar/Calendar";
import {
  getEventBuffers,
  getNewReservation,
  getSlotPropGetter,
  getTimeslots,
} from "common/src/calendar/util";
import { breakpoints } from "common/src/common/style";
import { parseDate } from "common/src/common/util";
import { PendingReservation, Reservation } from "common/types/common";
import {
  ApplicationRoundType,
  ReservationType,
  ReservationUnitByPkType,
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
import { useTranslation } from "react-i18next";
import { useMedia } from "react-use";
import styled from "styled-components";
import { Toolbar } from "common/src/calendar/Toolbar";
import {
  canReservationTimeBeChanged,
  isReservationReservable,
} from "../../modules/reservation";
import { getReservationUnitPrice } from "../../modules/reservationUnit";
import { formatDurationMinutes, isTouchDevice } from "../../modules/util";
import { BlackButton, MediumButton } from "../../styles/util";
import Legend from "../calendar/Legend";
import ReservationCalendarControls from "../calendar/ReservationCalendarControls";
import { CalendarWrapper } from "../reservation-unit/ReservationUnitStyles";

type Props = {
  reservation: ReservationType;
  reservationUnit: ReservationUnitByPkType;
  userReservations: ReservationType[];
  initialReservation: PendingReservation;
  setInitialReservation: React.Dispatch<
    React.SetStateAction<PendingReservation>
  >;
  activeApplicationRounds: ApplicationRoundType[];
  setErrorMsg: React.Dispatch<React.SetStateAction<string>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

type ReservationStateWithInitial = string;

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
  margin: var(--spacing-layout-m) 0 var(--spacing-layout-l);
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    flex-direction: row;
  }
`;

const eventStyleGetter = (
  { event }: CalendarEvent<Reservation | ReservationType>,
  ownReservations: number[],
  draggable = true
): { style: React.CSSProperties; className?: string } => {
  const style = {
    borderRadius: "0px",
    opacity: "0.8",
    color: "var(--color-white)",
    display: "block",
    borderColor: "transparent",
  } as Record<string, string>;
  let className = "";

  const isOwn =
    ownReservations?.includes((event as ReservationType).pk) &&
    (event?.state as ReservationStateWithInitial) !== "BUFFER";

  const state = isOwn ? "OWN" : (event?.state as ReservationStateWithInitial);

  switch (state) {
    case "INITIAL":
      style.backgroundColor = "var(--tilavaraus-event-initial-color)";
      style.color = "var(--color-black)";
      style.border = "2px dashed var(--tilavaraus-event-initial-border)";
      className = draggable ? "rbc-event-movable" : "";
      break;
    case "OWN":
      style.backgroundColor = "var(--tilavaraus-event-initial-color)";
      style.color = "var(--color-black)";
      style.border = "2px solid var(--tilavaraus-event-initial-border)";
      break;
    case "BUFFER":
      style.backgroundColor = "var(--color-black-5)";
      className = "rbc-event-buffer";
      break;
    default:
      style.backgroundColor = "var(--tilavaraus-event-reservation-color)";
      style.border = "2px solid var(--tilavaraus-event-reservation-border)";
      style.color = "var(--color-black)";
  }

  return {
    style,
    className,
  };
};

const EventWrapper = styled.div``;

const EventWrapperComponent = (props) => {
  const { event } = props;
  let isSmall = false;
  let isMedium = false;
  if (event.event.state === "INITIAL") {
    const { start, end } = props.event;
    const diff = differenceInMinutes(end, start);
    if (diff <= 30) isSmall = true;
    if (diff <= 120) isMedium = true;
  }
  return (
    <EventWrapper {...props} className={classNames({ isSmall, isMedium })} />
  );
};

const EditStep0 = ({
  reservation,
  reservationUnit,
  userReservations,
  initialReservation,
  setInitialReservation,
  activeApplicationRounds,
  setErrorMsg,
  setStep,
}: Props): JSX.Element => {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);

  const [focusDate, setFocusDate] = useState(new Date(reservation.begin));
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");

  const isClientATouchDevice = isTouchDevice();
  const [shouldCalendarControlsBeVisible, setShouldCalendarControlsBeVisible] =
    useState(false);

  const calendarEvents: CalendarEvent<Reservation | ReservationType>[] =
    useMemo(() => {
      const diff =
        initialReservation &&
        differenceInMinutes(
          new Date(initialReservation.end),
          new Date(initialReservation.begin)
        );
      const duration = diff >= 90 ? `(${formatDurationMinutes(diff)})` : "";
      const shownReservation = { ...initialReservation, state: "INITIAL" } || {
        begin: reservation.begin,
        end: reservation.end,
        state: "OWN",
      };
      const reservations = initialReservation?.begin
        ? reservationUnit?.reservations.filter((n) => n.pk !== reservation.pk)
        : reservationUnit?.reservations;
      return userReservations && reservationUnit?.reservations
        ? [...reservations, shownReservation]
            .filter((n: ReservationType) => n)
            .map((n: ReservationType | PendingReservation) => {
              const suffix = n.state === "INITIAL" ? duration : "";
              const event = {
                title: `${
                  n.state === "CANCELLED"
                    ? `${t("reservationCalendar:prefixForCancelled")}: `
                    : suffix
                }`,
                start: parseDate(n.begin),
                end: parseDate(n.end),
                allDay: false,
                event: n,
              };

              return event as CalendarEvent<Reservation>;
            })
        : [];
    }, [
      reservationUnit,
      t,
      initialReservation,
      userReservations,
      reservation.pk,
      reservation.begin,
      reservation.end,
    ]);

  const normalizedReservationUnit = useMemo(() => {
    return {
      ...reservationUnit,
      reservations: reservationUnit.reservations?.filter(
        (n) => n.pk !== reservation.pk
      ),
    };
  }, [reservation.pk, reservationUnit]);

  const eventBuffers = useMemo(() => {
    return getEventBuffers([
      ...(calendarEvents.flatMap((e) => e.event) as ReservationType[]),

      {
        begin: initialReservation?.begin || reservation.begin,
        end: initialReservation?.end || reservation.end,
        bufferTimeBefore: reservationUnit?.bufferTimeBefore?.toString(),
        bufferTimeAfter: reservationUnit?.bufferTimeAfter?.toString(),
      },
    ]);
  }, [
    calendarEvents,
    initialReservation,
    reservation.begin,
    reservation.end,
    reservationUnit?.bufferTimeAfter,
    reservationUnit?.bufferTimeBefore,
  ]);

  const isSlotFree = useCallback(
    (start: Date): boolean => {
      const price = getReservationUnitPrice({
        reservationUnit,
        pricingDate: start,
        asInt: true,
      });
      return price === "0";
    },
    [reservationUnit]
  );

  const slotPropGetter = useMemo(
    () =>
      reservationUnit &&
      getSlotPropGetter({
        openingHours: reservationUnit.openingHours?.openingTimes,
        activeApplicationRounds,
        reservationBegins: reservationUnit.reservationBegins
          ? new Date(reservationUnit.reservationBegins)
          : undefined,
        reservationEnds: reservationUnit.reservationEnds
          ? new Date(reservationUnit.reservationEnds)
          : undefined,
        reservationsMinDaysBefore: reservationUnit.reservationsMinDaysBefore,
        currentDate: focusDate,
        customValidation: (date) => isSlotFree(date),
      }),
    [activeApplicationRounds, reservationUnit, isSlotFree, focusDate]
  );

  const TouchCellWrapper = ({ children, value, onSelectSlot }): JSX.Element => {
    return React.cloneElement(Children.only(children), {
      onTouchEnd: () => onSelectSlot({ action: "click", slots: [value] }),
      style: {
        className: `${children}`,
      },
    });
  };

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
      { start, end }: CalendarEvent<Reservation | ReservationType>,
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
    ({ start, end, action }, skipLengthCheck = false): boolean => {
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

  return (
    <>
      <CalendarWrapper>
        <div aria-hidden>
          <Calendar<Reservation | ReservationType>
            events={[...calendarEvents, ...eventBuffers]}
            begin={currentDate}
            onNavigate={(d: Date) => {
              setFocusDate(d);
            }}
            eventStyleGetter={(event) =>
              eventStyleGetter(
                event,
                userReservations?.map((n) => n.pk),
                true
              )
            }
            slotPropGetter={slotPropGetter}
            viewType={calendarViewType}
            onView={(n: WeekOptions) => {
              setCalendarViewType(n);
            }}
            onSelecting={(event: CalendarEvent<ReservationType>) =>
              handleEventChange(event, true)
            }
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
            draggableAccessor={({ event }: CalendarEvent<ReservationType>) =>
              (event.state as ReservationStateWithInitial) === "INITIAL"
            }
            resizableAccessor={({ event }: CalendarEvent<ReservationType>) =>
              (event.state as ReservationStateWithInitial) === "INITIAL"
            }
            step={30}
            timeslots={getTimeslots(reservationUnit.reservationStartInterval)}
            culture={i18n.language}
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
            const newReservation: PendingReservation = {
              ...initialReservation,
              price: getReservationUnitPrice({
                reservationUnit,
                pricingDate: initialReservation.begin
                  ? new Date(initialReservation.begin)
                  : null,
                minutes: 0,
                asInt: true,
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
              setStep(1);
            }
          }}
          data-testid="reservation-edit__button--continue"
        >
          {t("reservationCalendar:nextStep")}
        </MediumButton>
      </Actions>
    </>
  );
};

export default EditStep0;
