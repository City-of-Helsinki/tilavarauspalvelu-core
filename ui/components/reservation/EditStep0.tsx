import Calendar, { CalendarEvent } from "common/src/calendar/Calendar";
import {
  getEventBuffers,
  getMaxReservation,
  getSlotPropGetter,
  getTimeslots,
  isReservationShortEnough,
} from "common/src/calendar/util";
import { breakpoints } from "common/src/common/style";
import { parseDate } from "common/src/common/util";
import { PendingReservation } from "common/types/common";
import {
  ApplicationRoundType,
  ReservationType,
  ReservationUnitByPkType,
} from "common/types/gql-types";
import {
  addHours,
  addSeconds,
  differenceInMinutes,
  roundToNearestMinutes,
  startOfDay,
} from "date-fns";
import { IconArrowRight, IconCross } from "hds-react";
import { useRouter } from "next/router";
import React, { Children, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMedia } from "react-use";
import styled from "styled-components";
import {
  canReservationTimeBeChanged,
  isReservationReservable,
} from "../../modules/reservation";
import { getReservationUnitPrice } from "../../modules/reservationUnit";
import { isTouchDevice } from "../../modules/util";
import { BlackButton, MediumButton } from "../../styles/util";
import Legend from "../calendar/Legend";
import ReservationCalendarControls from "../calendar/ReservationCalendarControls";
import { Toolbar } from "../calendar/Toolbar";

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

const CalendarWrapper = styled.div`
  position: relative;
`;

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
  { event }: CalendarEvent<ReservationType>,
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
  if (event.event.state === "INITIAL") {
    const { start, end } = props.event;
    const diff = differenceInMinutes(end, start);
    if (diff <= 30) isSmall = true;
  }
  return <EventWrapper {...props} className={isSmall ? "isSmall" : ""} />;
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

  const calendarEvents: CalendarEvent<ReservationType>[] = useMemo(() => {
    const shownReservation = initialReservation || {
      begin: reservation.begin,
      end: reservation.end,
      state: "OWN",
    };
    return userReservations && reservationUnit?.reservations
      ? [...reservationUnit.reservations, shownReservation]
          .filter((n: ReservationType) => n)
          .map((n: ReservationType) => {
            const event = {
              title: `${
                n.state === "CANCELLED"
                  ? `${t("reservationCalendar:prefixForCancelled")}: `
                  : ""
              }`,
              start: parseDate(n.begin),
              end: parseDate(n.end),
              allDay: false,
              event: n,
            };

            return event;
          })
      : [];
  }, [
    reservationUnit,
    t,
    initialReservation,
    userReservations,
    reservation.begin,
    reservation.end,
  ]);

  const eventBuffers = useMemo(() => {
    return getEventBuffers([
      ...(calendarEvents.flatMap((e) => e.event) as ReservationType[]),

      {
        begin: initialReservation?.begin || reservation.begin,
        end: initialReservation?.end || reservation.end,
        state: "INITIAL",
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
      getSlotPropGetter(
        reservationUnit.openingHours?.openingTimes,
        activeApplicationRounds,
        reservationUnit.reservationBegins
          ? new Date(reservationUnit.reservationBegins)
          : undefined,
        reservationUnit.reservationEnds
          ? new Date(reservationUnit.reservationEnds)
          : undefined,
        reservationUnit.reservationsMinDaysBefore,
        (date) => isSlotFree(date)
      ),
    [activeApplicationRounds, reservationUnit, isSlotFree]
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
          reservationUnit,
          activeApplicationRounds,
          start,
          end,
          skipLengthCheck,
        }) && isSlotFree(start)
      );
    },
    [activeApplicationRounds, reservationUnit, isSlotFree]
  );

  const handleEventChange = useCallback(
    (
      { start, end }: CalendarEvent<ReservationType>,
      skipLengthCheck = false
    ): boolean => {
      const normalizedEnd = roundToNearestMinutes(end);

      const newReservation = {
        begin: start?.toISOString(),
        end: normalizedEnd?.toISOString(),
      } as PendingReservation;

      if (
        !isReservationShortEnough(
          start,
          end,
          reservationUnit.maxReservationDuration
        )
      ) {
        const { end: newEnd } = getMaxReservation(
          start,
          reservationUnit.maxReservationDuration
        );
        newReservation.end = newEnd?.toISOString();
      } else if (!isSlotReservable(start, end, skipLengthCheck)) {
        return false;
      }

      const price = getReservationUnitPrice({
        reservationUnit,
        pricingDate: start,
        minutes: 0,
        asInt: true,
      });

      setInitialReservation({
        begin: newReservation.begin,
        end: newReservation.end,
        state: "INITIAL",
        price,
      } as PendingReservation);

      if (isClientATouchDevice) {
        setShouldCalendarControlsBeVisible(true);
      }

      return true;
    },
    [
      isClientATouchDevice,
      isSlotReservable,
      reservationUnit,
      setInitialReservation,
    ]
  );

  const handleSlotClick = useCallback(
    (
      { start: startTime, end: endTime, action },
      skipLengthCheck = false
    ): boolean => {
      const isTouchClick = action === "select" && isClientATouchDevice;

      if (action === "select" && !isClientATouchDevice) {
        return false;
      }

      const end =
        action === "click" ||
        (isTouchClick && differenceInMinutes(endTime, startTime) <= 30)
          ? addSeconds(
              new Date(startTime),
              reservationUnit.minReservationDuration || 0
            )
          : new Date(endTime);

      const normalizedEnd = roundToNearestMinutes(end);

      if (!isSlotReservable(startTime, end, skipLengthCheck)) {
        return false;
      }

      const price = getReservationUnitPrice({
        reservationUnit,
        pricingDate: startTime,
        minutes: 0,
        asInt: true,
      });

      setInitialReservation({
        begin: startTime.toISOString(),
        end: normalizedEnd.toISOString(),
        state: "INITIAL",
        price,
      } as PendingReservation);
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
          <Calendar<ReservationType>
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
            reservationUnit={reservationUnit}
            begin={initialReservation?.begin}
            end={initialReservation?.end}
            resetReservation={() => {
              setInitialReservation(null);
            }}
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
            minTime={dayStartTime}
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
          disabled={!initialReservation}
          onClick={() => {
            const [isNewReservationValid, validationError] =
              canReservationTimeBeChanged({
                reservation,
                newReservation:
                  initialReservation as unknown as ReservationType,
                reservationUnit,
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
