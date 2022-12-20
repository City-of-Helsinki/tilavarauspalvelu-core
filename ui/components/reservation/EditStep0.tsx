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
import { addSeconds } from "date-fns";
import { IconArrowRight, IconCross } from "hds-react";
import { useRouter } from "next/router";
import React, { Children, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  canReservationTimeBeChanged,
  isReservationReservable,
} from "../../modules/reservation";
import { getReservationUnitPrice } from "../../modules/reservationUnit";
import { BlackButton, MediumButton } from "../../styles/util";
import Legend from "../calendar/Legend";
import ReservationCalendarControls from "../calendar/ReservationCalendarControls";
import Toolbar, { ToolbarProps } from "../calendar/Toolbar";

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
  draggable = true,
  ownReservations: number[]
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

  const [focusDate, setFocusDate] = useState(new Date());
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");

  const calendarEvents: CalendarEvent<ReservationType>[] = useMemo(() => {
    return userReservations && reservationUnit?.reservations
      ? [...reservationUnit.reservations, initialReservation]
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
  }, [reservationUnit, t, initialReservation, userReservations]);

  const eventBuffers = useMemo(() => {
    return getEventBuffers([
      ...(calendarEvents.flatMap((e) => e.event) as ReservationType[]),
      {
        begin: initialReservation?.begin,
        end: initialReservation?.end,
        state: "INITIAL",
        bufferTimeBefore: reservationUnit?.bufferTimeBefore.toString(),
        bufferTimeAfter: reservationUnit?.bufferTimeAfter.toString(),
      },
    ]);
  }, [calendarEvents, initialReservation, reservationUnit]);
  const ToolbarWithProps = React.memo((props: ToolbarProps) => (
    <Toolbar {...props} />
  ));

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
        reservationUnit.reservationsMinDaysBefore
      ),
    [activeApplicationRounds, reservationUnit]
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
      return isReservationReservable({
        reservationUnit,
        activeApplicationRounds,
        start,
        end,
        skipLengthCheck,
      });
    },
    [activeApplicationRounds, reservationUnit]
  );

  const handleEventChange = useCallback(
    (
      { start, end }: CalendarEvent<ReservationType>,
      skipLengthCheck = false
    ): boolean => {
      const newReservation = {
        begin: start?.toISOString(),
        end: end?.toISOString(),
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

      const price = getReservationUnitPrice(
        reservationUnit,
        start,
        0,
        false,
        true
      );

      setInitialReservation({
        begin: newReservation.begin,
        end: newReservation.end,
        state: "INITIAL",
        price,
      } as PendingReservation);
      return true;
    },
    [isSlotReservable, reservationUnit, setInitialReservation]
  );

  const handleSlotClick = useCallback(
    ({ start, action }, skipLengthCheck = false): boolean => {
      if (action !== "click") {
        return false;
      }

      const end = addSeconds(
        new Date(start),
        reservationUnit.minReservationDuration || 0
      );

      if (!isSlotReservable(start, end, skipLengthCheck)) {
        return false;
      }

      const price = getReservationUnitPrice(
        reservationUnit,
        start,
        0,
        false,
        true
      );

      setInitialReservation({
        begin: start.toISOString(),
        end: end.toISOString(),
        state: "INITIAL",
        price,
      } as PendingReservation);
      return true;
    },
    [isSlotReservable, reservationUnit, setInitialReservation]
  );

  return (
    <>
      <CalendarWrapper>
        <div aria-hidden>
          <Calendar<ReservationType>
            events={[...calendarEvents, ...eventBuffers]}
            begin={focusDate || new Date()}
            onNavigate={(d: Date) => {
              setFocusDate(d);
            }}
            eventStyleGetter={(event) =>
              eventStyleGetter(
                event,
                true,
                userReservations?.map((n) => n.pk)
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
            showToolbar
            reservable
            toolbarComponent={
              reservationUnit?.nextAvailableSlot ? ToolbarWithProps : Toolbar
            }
            dateCellWrapperComponent={(props) => (
              <TouchCellWrapper {...props} onSelectSlot={handleSlotClick} />
            )}
            resizable
            draggable
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
        >
          {t("reservationCalendar:nextStep")}
        </MediumButton>
      </Actions>
    </>
  );
};

export default EditStep0;
