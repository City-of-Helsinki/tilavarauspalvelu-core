import React, { useEffect, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useMedia } from "react-use";
import { gql } from "@apollo/client";
import { addMinutes, differenceInMinutes } from "date-fns";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import { getEventBuffers } from "@ui/components/calendar/utils";
import { DatedWeekCalendar } from "@ui/components/DatedWeekCalendar/DatedWeekCalendar";
import type { DatedEvent, DatedRange, DatedWeekView } from "@ui/components/DatedWeekCalendar/types";
import type { CalendarEvent, CalendarEventBuffer, SlotProps } from "ui/src/components/calendar/Calendar";
import { breakpoints, RELATED_RESERVATION_STATES } from "ui/src/modules/const";
import { formatApiDate, formatDate, formatDuration, formatTime, parseUIDate } from "ui/src/modules/date-utils";
import { filterNonNullable, getLocalizationLang } from "ui/src/modules/helpers";
import { ReservationTypeChoice, useListReservationsQuery } from "@gql/gql-types";
import type {
  BlockingReservationFieldsFragment,
  ReservationTimePickerFieldsFragment,
  ReservationNode,
} from "@gql/gql-types";
import { Legend } from "@/components/calendar/Legend";
import { useCurrentUser } from "@/hooks";
import { eventStyleGetter } from "@/modules/eventStyleGetter";
import { getBoundCheckedReservation, getSlotPropGetter, isRangeReservable } from "@/modules/reservable";
import type { ReservableMap } from "@/modules/reservable";
import { convertFormToFocustimeSlot, getDurationOptions, getNewReservation } from "@/modules/reservation";
import type { PendingReservationFormType } from "@/modules/schemas/reservationUnit";
import { ReservationCalendarControls } from "../calendar/ReservationCalendarControls";

const DRAFT_ID = "draft";
const CALENDAR_STEP_MINUTES = 30;
const CONTROLS_ID = "reservation-time-controls";

type PickerData = { source: CalendarEvent<ReservationNode> | CalendarEventBuffer };

const stateOf = ({ source }: PickerData) => source.event?.state as string | undefined;

// Buffers are built from reservations so they carry a pk, but they are typed as only a state.
const reservationOf = ({ source }: PickerData): ReservationNode | null =>
  source.event != null && "pk" in source.event ? source.event : null;

function toDatedEvent(source: PickerData["source"], index: number): DatedEvent<PickerData> {
  const state = source.event?.state as string | undefined;
  const kind = state === "INITIAL" ? "draft" : state === "BUFFER" ? "buffer" : "reservation";
  const pk = reservationOf({ source })?.pk;
  return {
    id: kind === "draft" ? DRAFT_ID : `${kind}-${pk ?? index}-${source.start.getTime()}`,
    title: "title" in source && source.title ? source.title : "",
    start: source.start,
    end: source.end,
    data: { source },
  };
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
  blockingReservations: ReadonlyArray<BlockingReservationFieldsFragment>;
  reservationForm: UseFormReturn<PendingReservationFormType>;
  isReservationQuotaReached: boolean;
  submitReservation: (d: PendingReservationFormType) => void;
  loginAndSubmitButton?: React.ReactElement;
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
  blockingReservations: ReadonlyArray<BlockingReservationFieldsFragment>;
}): Array<CalendarEventBuffer | CalendarEvent<ReservationNode>> {
  const { t } = useTranslation();
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
}: ReservationTimePickerProps): React.ReactElement {
  const { t, i18n } = useTranslation();
  const [calendarViewType, setCalendarViewType] = useState<DatedWeekView>("week");
  const { watch, setValue } = reservationForm;
  const activeApplicationRounds = reservationUnit.applicationRounds;
  const locale = getLocalizationLang(i18n.language);
  const dateValue = watch("date");

  const now = useMemo(() => new Date(), []);
  const focusDate = parseUIDate(dateValue) ?? new Date();

  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- doesn't work without async update
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

  const isOpen = useMemo(() => (range: DatedRange) => slotPropGetter(range.start).className == null, [slotPropGetter]);

  const { currentUser } = useCurrentUser();

  const durationOptions = getDurationOptions(reservationUnit, t);

  const handleCalendarEventChange = ({ start, end }: DatedRange): boolean => {
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

  const handleSlotClick = ({ start, end }: DatedRange): boolean => {
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

  const ownReservationPks = filterNonNullable(userReservations.map((n) => n?.pk));
  const datedEvents = useMemo(() => calendarEvents.map((item, index) => toDatedEvent(item, index)), [calendarEvents]);

  const getEventLabel = (item: DatedEvent<PickerData>) => {
    const state = stateOf(item.data);
    const reservation = reservationOf(item.data);
    if (state === "INITIAL") {
      return t("reservationCalendar:legend.initial");
    }
    if (state === "BUFFER") {
      return t("reservationCalendar:legend.buffer");
    }
    if (reservation?.pk != null && ownReservationPks.includes(reservation.pk)) {
      return t("reservationCalendar:legend.initial");
    }
    if (state === "CANCELLED") {
      return t("reservationCalendar:legend.cancelledLabel");
    }
    return reservation?.isBlocked ? t("reservationCalendar:legend.unavailable") : t("reservationCalendar:legend.busy");
  };

  const refuseUnless = (isAccepted: boolean) => (isAccepted ? null : t("reservationCalendar:cannotReserveHere"));

  const viewName = (calendarViewType === "day" ? t("common:day") : t("common:week")).toLowerCase();
  const draftLabels = {
    hint: t("reservationCalendar:draft.hint"),
    grabbed: t("reservationCalendar:draft.grabbed"),
    moved: t("reservationCalendar:draft.moved"),
    cancelled: t("reservationCalendar:draft.cancelled"),
    slotSelected: t("reservationCalendar:draft.slotSelected"),
    controls: t("reservationCalendar:draft.controls"),
    earlier: t("reservationCalendar:draft.earlier"),
    later: t("reservationCalendar:draft.later"),
    shorter: t("reservationCalendar:draft.shorter"),
    longer: t("reservationCalendar:draft.longer"),
  };

  const labels = {
    toolbar: t("reservationCalendar:toolbar"),
    previous: t("reservationCalendar:showPrevious", { view: viewName }),
    next: t("reservationCalendar:showNext", { view: viewName }),
    today: t("common:today"),
    day: t("common:day"),
    week: t("common:week"),
    list: t("reservationCalendar:list"),
    skipToList: t("reservationCalendar:skipToList"),
    emptyList: t("reservationCalendar:emptyList"),
    free: t("reservationCalendar:free"),
    closed: t("reservationCalendar:closed"),
    opensInNewTab: t("reservationCalendar:opensInNewTab"),
    draft: draftLabels,
  };

  return (
    <>
      <DatedWeekCalendar<PickerData>
        aria-label={t("reservationCalendar:selectTime")}
        date={focusDate}
        onNavigate={(d) => setValue("date", formatDate(d))}
        view={calendarViewType}
        onViewChange={setCalendarViewType}
        events={datedEvents}
        step={CALENDAR_STEP_MINUTES}
        locale={locale}
        isOpen={isOpen}
        draftId={focusSlot.isReservable ? DRAFT_ID : undefined}
        onSelectSlot={isReservationQuotaReached ? undefined : (range) => refuseUnless(handleSlotClick(range))}
        onMoveDraft={isReservationQuotaReached ? undefined : (range) => refuseUnless(handleCalendarEventChange(range))}
        alternative={{ id: CONTROLS_ID, label: t("reservationCalendar:skipToForm") }}
        getEventLabel={getEventLabel}
        getEventProps={({ data: { source } }) =>
          eventStyleGetter(source as CalendarEvent<ReservationNode>, ownReservationPks, !isReservationQuotaReached)
        }
        labels={labels}
      />
      <CalendarFooter id={CONTROLS_ID} tabIndex={-1} aria-live="polite" aria-expanded={areControlsVisible}>
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
