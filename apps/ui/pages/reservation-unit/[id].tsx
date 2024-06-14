import React, {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { GetServerSidePropsContext } from "next";
import { Trans, useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import {
  addHours,
  addMinutes,
  addSeconds,
  addYears,
  differenceInMinutes,
  set,
  startOfDay,
} from "date-fns";
import {
  fromUIDate,
  isValidDate,
  toApiDate,
  toUIDate,
} from "common/src/common/util";
import { getEventBuffers } from "common/src/calendar/util";
import { Container, formatters as getFormatters } from "common";
import { useLocalStorage, useMedia } from "react-use";
import { breakpoints } from "common/src/common/style";
import Calendar, { type CalendarEvent } from "common/src/calendar/Calendar";
import { Toolbar } from "common/src/calendar/Toolbar";
import classNames from "classnames";
import { type PendingReservation } from "@/modules/types";
import {
  ApplicationRoundStatusChoice,
  type ApplicationRoundTimeSlotNode,
  PricingType,
  type ReservationCreateMutationInput,
  type ReservationNode,
  useCreateReservationMutation,
  useListReservationsQuery,
  type ApplicationRoundPeriodsQuery,
  ApplicationRoundPeriodsDocument,
  type ReservationUnitPageQuery,
  type ReservationUnitPageQueryVariables,
  ReservationUnitPageDocument,
  RelatedReservationUnitsDocument,
  type RelatedReservationUnitsQuery,
  type RelatedReservationUnitsQueryVariables,
} from "@gql/gql-types";
import {
  base64encode,
  filterNonNullable,
  fromMondayFirstUnsafe,
  getLocalizationLang,
} from "common/src/helpers";
import Head from "@/components/reservation-unit/Head";
import { AddressSection } from "@/components/reservation-unit/Address";
import Sanitize from "@/components/common/Sanitize";
import RelatedUnits, {
  type RelatedNodeT,
} from "@/components/reservation-unit/RelatedUnits";
import { AccordionWithState as Accordion } from "@/components/common/Accordion";
import { createApolloClient } from "@/modules/apolloClient";
import { Map as MapComponent } from "@/components/Map";
import Legend from "@/components/calendar/Legend";
import ReservationCalendarControls, {
  type FocusTimeSlot,
} from "@/components/calendar/ReservationCalendarControls";
import {
  formatDuration,
  getPostLoginUrl,
  getTranslation,
  isTouchDevice,
  printErrorMessages,
} from "@/modules/util";
import {
  getFuturePricing,
  getPossibleTimesForDay,
  getPrice,
  getTimeString,
  isReservationUnitPaidInFuture,
  isReservationUnitPublished,
  isReservationUnitReservable,
} from "@/modules/reservationUnit";
import EquipmentList from "@/components/reservation-unit/EquipmentList";
import { JustForDesktop, JustForMobile } from "@/modules/style/layout";
import {
  SLOTS_EVERY_HOUR,
  getDurationOptions,
  getNewReservation,
  isReservationStartInFuture,
} from "@/modules/reservation";
import { getSlotPropGetter, isRangeReservable } from "@/modules/reservable";
import SubventionSuffix from "@/components/reservation/SubventionSuffix";
import InfoDialog from "@/components/common/InfoDialog";
import {
  BottomContainer,
  BottomWrapper,
  CalendarFooter,
  CalendarWrapper,
  Content,
  MapWrapper,
  PaddedContent,
  StyledNotification,
  Subheading,
  TwoColumnLayout,
  Wrapper,
} from "@/components/reservation-unit/ReservationUnitStyles";
import QuickReservation, {
  type TimeRange,
} from "@/components/reservation-unit/QuickReservation";
import ReservationInfoContainer from "@/components/reservation-unit/ReservationInfoContainer";
import { useCurrentUser } from "@/hooks/user";
import { CenterSpinner } from "@/components/common/common";
import {
  getCommonServerSideProps,
  getGenericTerms,
} from "@/modules/serverUtils";
import { eventStyleGetter } from "@/components/common/calendarUtils";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getNextAvailableTime } from "@/components/reservation-unit/utils";
import {
  PendingReservationFormSchema,
  type PendingReservationFormType,
} from "@/components/reservation-unit/schema";
import { MediumButton } from "@/styles/util";
import LoginFragment from "@/components/LoginFragment";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { ErrorToast } from "@/components/common/ErrorToast";
import { ReservationTypeChoice } from "common/gql/gql-types";
import { useReservableTimes } from "@/hooks/useReservableTimes";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

type WeekOptions = "day" | "week" | "month";

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { params, query, locale } = ctx;
  const pk = Number(params?.id);
  const uuid = query.ru;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  // TODO does this return only possible rounds or do we need to do frontend filtering on them?
  const { data } = await apolloClient.query<ApplicationRoundPeriodsQuery>({
    query: ApplicationRoundPeriodsDocument,
  });
  const activeApplicationRounds = filterNonNullable(
    data?.applicationRounds?.edges?.map((e) => e?.node)
  )
    .filter((n) => n.status === ApplicationRoundStatusChoice.Open)
    .filter((n) => n?.reservationUnits?.find((x) => x?.pk === pk));

  if (pk) {
    const today = new Date();
    const startDate = today;
    const endDate = addYears(today, 2);

    const typename = "ReservationUnitNode";
    const id = base64encode(`${typename}:${pk}`);
    const { data: reservationUnitData } = await apolloClient.query<
      ReservationUnitPageQuery,
      ReservationUnitPageQueryVariables
    >({
      query: ReservationUnitPageDocument,
      fetchPolicy: "no-cache",
      variables: {
        id,
        beginDate: toApiDate(startDate) ?? "",
        endDate: toApiDate(endDate) ?? "",
        state: RELATED_RESERVATION_STATES,
        pk,
      },
    });

    const previewPass = uuid === reservationUnitData.reservationUnit?.uuid;

    const reservationUnit = reservationUnitData?.reservationUnit ?? undefined;
    if (!isReservationUnitPublished(reservationUnit) && !previewPass) {
      return {
        props: {
          ...commonProps,
          notFound: true, // required for type narrowing
        },
        notFound: true,
      };
    }

    const isDraft = reservationUnit?.isDraft;
    if (isDraft && !previewPass) {
      return {
        props: {
          ...commonProps,
          notFound: true, // required for type narrowing
        },
        notFound: true,
      };
    }

    const bookingTerms = await getGenericTerms(apolloClient);

    let relatedReservationUnits: RelatedNodeT[] = [];
    if (reservationUnit?.unit?.pk) {
      const { data: relatedData } = await apolloClient.query<
        RelatedReservationUnitsQuery,
        RelatedReservationUnitsQueryVariables
      >({
        query: RelatedReservationUnitsDocument,
        variables: {
          unit: [reservationUnit.unit.pk],
          isVisible: true,
        },
      });

      relatedReservationUnits = filterNonNullable(
        relatedData?.reservationUnits?.edges?.map((n) => n?.node)
      ).filter((n) => n?.pk !== reservationUnitData.reservationUnit?.pk);
    }

    if (!reservationUnit?.pk) {
      return {
        props: {
          ...commonProps,
          notFound: true, // required for type narrowing
        },
        notFound: true,
      };
    }

    const reservableTimeSpans = filterNonNullable(
      reservationUnitData.reservationUnit?.reservableTimeSpans
    );
    const queryParams = new URLSearchParams(query as Record<string, string>);
    const searchDate = queryParams.get("date") ?? null;
    const searchTime = queryParams.get("time") ?? null;
    const searchDuration = Number.isNaN(Number(queryParams.get("duration")))
      ? null
      : Number(queryParams.get("duration"));

    const affectingReservations = filterNonNullable(
      reservationUnitData?.affectingReservations
    );
    const reservationSet = filterNonNullable(
      reservationUnitData?.reservationUnit?.reservationSet
    );
    const doesReservationAffectReservationUnit = (
      reservation: (typeof affectingReservations)[0],
      resUnitPk: number
    ) => {
      return reservation.affectedReservationUnits?.some(
        (affectedPk) => affectedPk === resUnitPk
      );
    };

    const reservations = filterNonNullable(
      reservationSet?.concat(
        affectingReservations?.filter((y) =>
          doesReservationAffectReservationUnit(y, pk)
        ) ?? []
      )
    );

    return {
      props: {
        key: `${pk}-${locale}`,
        ...commonProps,
        ...(await serverSideTranslations(locale ?? "fi")),
        // TODO don't edit the GQL response (requires refactoring the component)
        reservationUnit: {
          ...reservationUnit,
          reservableTimeSpans,
          reservationSet: reservations,
        },
        relatedReservationUnits,
        activeApplicationRounds,
        termsOfUse: { genericTerms: bookingTerms },
        isPostLogin: query?.isPostLogin === "true",
        searchDuration,
        searchDate,
        searchTime,
      },
    };
  }

  return {
    props: {
      key: `${pk}-${locale}`,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
      notFound: true, // required for type narrowing
      paramsId: pk,
    },
    notFound: true,
  };
}

const Columns = styled(TwoColumnLayout)`
  > div:first-of-type {
    order: 1;
  }
`;

const RightColumn = styled.div`
  display: flex;
  gap: var(--spacing-l);
  flex-direction: column;
`;

const EventWrapper = styled.div``;

const EventWrapperComponent = ({
  event,
  ...props
}: {
  event: CalendarEvent<ReservationNode>;
}) => {
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
};

const StyledApplicationRoundScheduleDay = styled.div`
  span:first-child {
    display: inline-block;
    font-weight: bold;
    width: 9ch;
    margin-right: var(--spacing-s);
  }
`;

const SubmitButton = styled(MediumButton)`
  white-space: nowrap;

  > span {
    margin: 0 !important;
    padding-right: var(--spacing-3-xs);
    padding-left: var(--spacing-3-xs);
  }

  @media (min-width: ${breakpoints.m}) {
    order: unset;
  }
`;

// Returns an element for a weekday in the application round timetable, with up to two timespans
function ApplicationRoundScheduleDay(
  props: Omit<ApplicationRoundTimeSlotNode, "id" | "pk">
) {
  const { t } = useTranslation();
  const { weekday, reservableTimes, closed } = props;
  const noSeconds = (time: string) => time.split(":").slice(0, 2).join(":");
  const timeSlotString = (idx: number): string =>
    reservableTimes?.[idx]?.begin && reservableTimes?.[idx]?.end
      ? `${noSeconds(String(reservableTimes?.[idx]?.begin))}-${noSeconds(
          String(reservableTimes?.[idx]?.end)
        )}`
      : "";
  return (
    <StyledApplicationRoundScheduleDay>
      {/* eslint-disable react/no-unknown-property */}
      <span test-dataid="application-round-time-slot__weekday">
        {t(`common:weekDayLong.${fromMondayFirstUnsafe(weekday)}`)}
      </span>{" "}
      {closed ? (
        <span test-dataid="application-round-time-slot__value">-</span>
      ) : (
        reservableTimes && (
          <span test-dataid="application-round-time-slot__value">
            {reservableTimes[0] && timeSlotString(0)}
            {reservableTimes[1] && ` ${t("common:and")} ${timeSlotString(1)}`}
          </span>
        )
      )}
      {/* eslint-enable react/no-unknown-property */}
    </StyledApplicationRoundScheduleDay>
  );
}

const TouchCellWrapper = ({
  children,
  value,
  onSelectSlot,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO Calendar prop typing
any): JSX.Element => {
  return React.cloneElement(Children.only(children), {
    onTouchEnd: () => onSelectSlot({ action: "click", slots: [value] }),
    style: {
      className: `${children}`,
    },
  });
};

function SubmitFragment(
  props: Readonly<{
    focusSlot: TimeRange & { isReservable: boolean; durationMinutes: number };
    apiBaseUrl: string;
    actionCallback: () => void;
    reservationForm: UseFormReturn<PendingReservationFormType>;
    loadingText: string;
    buttonText: string;
  }>
) {
  return (
    <LoginFragment
      isActionDisabled={!props.focusSlot?.isReservable}
      apiBaseUrl={props.apiBaseUrl}
      actionCallback={props.actionCallback}
      componentIfAuthenticated={
        <SubmitButton
          disabled={!props.focusSlot?.isReservable}
          type="submit"
          isLoading={props.reservationForm.formState.isSubmitting}
          loadingText={props.loadingText}
          data-test="quick-reservation__button--submit"
        >
          {props.buttonText}
        </SubmitButton>
      }
      returnUrl={getPostLoginUrl()}
    />
  );
}

const ReservationUnit = ({
  reservationUnit,
  relatedReservationUnits,
  activeApplicationRounds,
  termsOfUse,
  isPostLogin,
  apiBaseUrl,
  searchDuration,
  searchDate,
  searchTime,
}: PropsNarrowed): JSX.Element | null => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);

  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);

  const durationOptions = getDurationOptions(reservationUnit, t);

  // technically these can be left empty (backend allows it)
  const minReservationDurationMinutes = reservationUnit.minReservationDuration
    ? reservationUnit.minReservationDuration / 60
    : 30;
  const maxReservationDurationMinutes = reservationUnit.maxReservationDuration
    ? reservationUnit.maxReservationDuration / 60
    : Number.MAX_SAFE_INTEGER;

  // Duration needs to always be within the bounds of the reservation unit
  // and be defined otherwise the Duration select breaks (visual bugs)
  const clampDuration = useCallback(
    (duration: number): number => {
      const initialDuration = Math.max(
        minReservationDurationMinutes,
        durationOptions[0]?.value ?? 0
      );
      return Math.min(
        Math.max(duration, initialDuration),
        maxReservationDurationMinutes
      );
    },
    [
      durationOptions,
      minReservationDurationMinutes,
      maxReservationDurationMinutes,
    ]
  );

  const searchUIDate = fromUIDate(searchDate ?? "");
  // TODO should be the first reservable day (the reservableTimeSpans logic is too complex and needs refactoring)
  // i.e. using a naive approach will return empty timespsans either reuse the logic for QuickReservation or refactor
  const defaultDate = new Date();
  const defaultDateString = toUIDate(defaultDate);
  const defaultValues = {
    date:
      searchUIDate != null && isValidDate(searchUIDate)
        ? searchDate ?? ""
        : defaultDateString,
    duration: clampDuration(searchDuration ?? 0),
    time: searchTime ?? getTimeString(defaultDate),
    isControlsVisible: true,
  };

  const reservationForm = useForm<PendingReservationFormType>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(PendingReservationFormSchema),
  });

  const { watch, setValue } = reservationForm;

  const durationValue = watch("duration");
  const dateValue = watch("date");
  const timeValue = watch("time");

  const focusDate = useMemo(() => {
    const [hours, minutes]: Array<number | undefined> = timeValue
      .split(":")
      .map(Number)
      .filter((n) => Number.isFinite(n));
    const maybeDate = fromUIDate(dateValue);
    if (maybeDate != null && isValidDate(maybeDate)) {
      return set(maybeDate, { hours, minutes });
    }
    return new Date();
  }, [dateValue, timeValue]);

  const submitReservation = (_data: PendingReservationFormType) => {
    if (reservationUnit.pk) {
      setErrorMsg(null);
    }
    const { start: begin, end } = focusSlot;
    if (reservationUnit?.pk == null || begin == null || end == null) {
      return;
    }
    const input: ReservationCreateMutationInput = {
      begin: begin.toISOString(),
      end: end.toISOString(),
      reservationUnitPks: [reservationUnit.pk],
    };
    createReservation(input);
  };

  const reservableTimes = useReservableTimes(reservationUnit);

  // TODO the use of focusSlot is weird it double's up for both
  // calendar focus date and the reservation slot which causes issues
  // the calendar focus date should always be defined but the form values should not have valid default values
  // not having valid values will break other things so requires refactoring.
  const focusSlot: FocusTimeSlot = useMemo(() => {
    const start = focusDate;
    const end = addMinutes(start, durationValue);
    const isReservable = isRangeReservable({
      range: {
        start,
        end,
      },
      reservationUnit,
      reservableTimes,
      activeApplicationRounds,
      skipLengthCheck: false,
    });

    return {
      start,
      end,
      isReservable,
      durationMinutes: durationValue,
    };
  }, [
    focusDate,
    durationValue,
    reservableTimes,
    reservationUnit,
    activeApplicationRounds,
  ]);

  const startingTimeOptions = useMemo(() => {
    return getPossibleTimesForDay(
      reservableTimes,
      reservationUnit?.reservationStartInterval,
      focusDate,
      reservationUnit,
      activeApplicationRounds,
      durationValue
    );
  }, [
    reservableTimes,
    reservationUnit,
    activeApplicationRounds,
    focusDate,
    durationValue,
  ]);

  const { currentUser } = useCurrentUser();

  // TODO add pagination
  // TODO also combine with other instances of LIST_RESERVATIONS
  const { data } = useListReservationsQuery({
    fetchPolicy: "no-cache",
    skip: !currentUser || !reservationUnit?.pk,
    variables: {
      beginDate: toApiDate(now),
      user: currentUser?.pk ?? 0,
      reservationUnit: [reservationUnit?.pk ?? 0],
      state: RELATED_RESERVATION_STATES,
      reservationType: ReservationTypeChoice.Normal,
    },
  });

  const userReservations = filterNonNullable(
    data?.reservations?.edges?.map((e) => e?.node)
  );

  const slotPropGetter = useMemo(() => {
    return getSlotPropGetter({
      reservableTimes,
      activeApplicationRounds,
      reservationBegins: reservationUnit?.reservationBegins
        ? new Date(reservationUnit.reservationBegins)
        : undefined,
      reservationEnds: reservationUnit?.reservationEnds
        ? new Date(reservationUnit.reservationEnds)
        : undefined,
      reservationsMinDaysBefore:
        reservationUnit?.reservationsMinDaysBefore ?? 0,
      reservationsMaxDaysBefore:
        reservationUnit?.reservationsMaxDaysBefore ?? 0,
    });
  }, [
    reservableTimes,
    activeApplicationRounds,
    reservationUnit?.reservationBegins,
    reservationUnit?.reservationEnds,
    reservationUnit?.reservationsMinDaysBefore,
    reservationUnit?.reservationsMaxDaysBefore,
  ]);

  const isReservationQuotaReached = useMemo(() => {
    return (
      reservationUnit?.maxReservationsPerUser != null &&
      reservationUnit?.numActiveUserReservations != null &&
      reservationUnit?.numActiveUserReservations >=
        reservationUnit?.maxReservationsPerUser
    );
  }, [
    reservationUnit?.maxReservationsPerUser,
    reservationUnit?.numActiveUserReservations,
  ]);

  const shouldDisplayApplicationRoundTimeSlots =
    !!activeApplicationRounds?.length;

  const { applicationRoundTimeSlots } = reservationUnit;

  const shouldDisplayPricingTerms = useMemo(() => {
    const pricings = filterNonNullable(reservationUnit?.pricings);
    if (pricings.length === 0) {
      return false;
    }
    return (
      reservationUnit?.canApplyFreeOfCharge &&
      isReservationUnitPaidInFuture(pricings)
    );
  }, [reservationUnit?.canApplyFreeOfCharge, reservationUnit?.pricings]);

  const handleCalendarEventChange = useCallback(
    ({ start, end }: CalendarEvent<ReservationNode>): boolean => {
      if (!reservationUnit) {
        return false;
      }

      if (isReservationQuotaReached) {
        return false;
      }

      // the next check is going to systematically fail unless the times are at least minReservationDuration apart
      const { minReservationDuration } = reservationUnit;
      const minEnd = addSeconds(start, minReservationDuration ?? 0);
      const newEnd = new Date(Math.max(end.getTime(), minEnd.getTime()));

      const isReservable = isRangeReservable({
        range: {
          start,
          end: newEnd,
        },
        reservationUnit,
        reservableTimes,
        activeApplicationRounds,
        skipLengthCheck: false,
      });

      if (!isReservable) {
        return false;
      }

      // Limit the duration to the max reservation duration
      // TODO should be replaced with a utility function that is properly named
      const { begin } = getNewReservation({
        start,
        end: newEnd,
        reservationUnit,
      });

      const newDate = toUIDate(begin);
      const newTime = getTimeString(begin);
      // duration should never be smaller than the minimum duration option
      const originalDuration = differenceInMinutes(end, start);
      const duration = clampDuration(originalDuration);
      setValue("date", newDate);
      setValue("duration", duration);
      setValue("time", newTime);

      if (isTouchDevice()) {
        // TODO test: does setValue work?
        setValue("isControlsVisible", true);
      }

      return true;
    },
    [
      clampDuration,
      isReservationQuotaReached,
      reservableTimes,
      reservationUnit,
      activeApplicationRounds,
      setValue,
    ]
  );

  const handleSlotClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO Calendar prop typing
    ({ start, end, action }: any): boolean => {
      const isTouchClick = action === "select" && isTouchDevice();

      if (
        (action === "select" && !isTouchDevice()) ||
        isReservationQuotaReached ||
        !reservationUnit
      ) {
        return false;
      }

      const normalizedEnd =
        action === "click" ||
        (isTouchClick && differenceInMinutes(end, start) <= 30)
          ? addSeconds(start, reservationUnit?.minReservationDuration ?? 0)
          : new Date(end);

      const isReservable = isRangeReservable({
        range: {
          start,
          end: normalizedEnd,
        },
        reservationUnit,
        reservableTimes,
        activeApplicationRounds,
        skipLengthCheck: false,
      });
      if (!isReservable) {
        return false;
      }

      const { begin } = getNewReservation({
        start: new Date(start),
        end: normalizedEnd,
        reservationUnit,
      });

      const newDate = toUIDate(begin);
      const newTime = getTimeString(begin);
      // click doesn't change the duration
      setValue("date", newDate);
      setValue("time", newTime);

      return true;
    },
    [
      isReservationQuotaReached,
      reservableTimes,
      reservationUnit,
      activeApplicationRounds,
      setValue,
    ]
  );

  useEffect(() => {
    setCalendarViewType(isMobile ? "day" : "week");
  }, [isMobile]);

  const calendarEvents: CalendarEvent<ReservationNode>[] = useMemo(() => {
    const { durationMinutes: diff, start, end } = focusSlot;
    const calendarDuration = diff >= 90 ? `(${formatDuration(diff, t)})` : "";

    const existingReservations = filterNonNullable(
      reservationUnit?.reservationSet
    );
    const focusEvent = {
      begin: start,
      end,
      state: "INITIAL",
    };
    const isReservable = isRangeReservable({
      range: {
        start,
        end,
      },
      reservationUnit,
      reservableTimes,
      activeApplicationRounds,
      skipLengthCheck: false,
    });

    const shouldDisplayFocusSlot = isReservable;

    return [
      ...existingReservations,
      ...(shouldDisplayFocusSlot ? [focusEvent] : []),
    ]
      .filter((n): n is NonNullable<typeof n> => n != null)
      .map((n) => {
        const suffix = n.state === "INITIAL" ? calendarDuration : "";
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
  }, [reservationUnit, reservableTimes, activeApplicationRounds, t, focusSlot]);

  // TODO should be combined with calendar events
  const eventBuffers = useMemo(() => {
    const bufferTimeBefore = reservationUnit.bufferTimeBefore;
    const bufferTimeAfter = reservationUnit.bufferTimeAfter;
    const evts = calendarEvents
      .flatMap((e) => e.event)
      .filter((n): n is NonNullable<typeof n> => n != null);
    const pendingReservation: PendingReservation = {
      begin: focusSlot.start.toISOString(),
      end: focusSlot.end.toISOString(),
      state: "INITIAL",
      bufferTimeBefore,
      bufferTimeAfter,
    };
    return getEventBuffers([
      ...evts,
      // focusSlot has invalid reservations when the slot isn't properly selected
      // similar check is in calendarEvents
      ...(focusSlot.isReservable ? [pendingReservation] : []),
    ]);
  }, [calendarEvents, focusSlot, reservationUnit]);

  // TODO: Refactor to try/catch
  const [addReservation] = useCreateReservationMutation({
    onCompleted: ({ createReservation }) => {
      const { pk } = createReservation ?? {};
      /// ??? errors
      if (focusSlot == null || pk == null) {
        return;
      }
      if (reservationUnit?.pk != null) {
        router.push(
          `/reservation-unit/${reservationUnit.pk}/reservation/${pk}`
        );
      }
    },
    onError: (error) => {
      const msg = printErrorMessages(error);
      setErrorMsg(msg || t("errors:general_error"));
    },
  });

  const createReservation = useCallback(
    async (input: ReservationCreateMutationInput): Promise<void> => {
      await addReservation({
        variables: {
          input,
        },
      });
    },
    [addReservation]
  );

  // Set default duration if it's not set
  useEffect(() => {
    if (!durationValue) {
      setValue("duration", durationOptions[0]?.value);
    }
  }, [dateValue, timeValue, durationValue, durationOptions, setValue]);

  // store reservation unit overall reservability to use in JSX and pass to some child elements
  const [reservationUnitIsReservable, reason] =
    isReservationUnitReservable(reservationUnit);
  if (!reservationUnitIsReservable) {
    // eslint-disable-next-line no-console
    console.warn("not reservable because: ", reason);
  }

  const [storedReservation, setStoredReservation] =
    useLocalStorage<PendingReservation>("reservation");
  const storeReservationForLogin = useCallback(() => {
    if (reservationUnit.pk != null && focusSlot != null) {
      const { start, end } = focusSlot ?? {};
      // NOTE the only place where we use ISO strings since they are always converted to Date objects
      // another option would be to refactor storaged reservation to use Date objects
      setStoredReservation({
        begin: start.toISOString(),
        end: end.toISOString(),
        price: undefined,
        reservationUnitPk: reservationUnit.pk ?? 0,
      });
    }
  }, [focusSlot, reservationUnit.pk, setStoredReservation]);

  // If returning from login, continue on to reservation details
  useEffect(() => {
    if (
      !!isPostLogin &&
      storedReservation &&
      !isReservationQuotaReached &&
      reservationUnit?.pk
    ) {
      const { begin, end } = storedReservation;
      const input: ReservationCreateMutationInput = {
        begin,
        end,
        reservationUnitPks: [reservationUnit.pk],
      };
      addReservation({
        variables: {
          input,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { begin, end } = storedReservation ?? {};
    if (begin == null || end == null) {
      return;
    }

    const beginDate = new Date(begin);
    const endDate = new Date(end);

    // TODO why? can't we set it using the form or can we make an intermediate reset function
    handleCalendarEventChange({
      start: beginDate,
      end: endDate,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedReservation?.begin, storedReservation?.end]);

  const shouldDisplayBottomWrapper = useMemo(
    () => relatedReservationUnits?.length > 0,
    [relatedReservationUnits?.length]
  );
  const termsOfUseContent = reservationUnit
    ? getTranslation(reservationUnit, "termsOfUse")
    : undefined;
  const paymentTermsContent = reservationUnit?.paymentTerms
    ? getTranslation(reservationUnit.paymentTerms, "text")
    : undefined;
  const cancellationTermsContent = reservationUnit?.cancellationTerms
    ? getTranslation(reservationUnit.cancellationTerms, "text")
    : undefined;
  const pricingTermsContent = reservationUnit?.pricingTerms
    ? getTranslation(reservationUnit.pricingTerms, "text")
    : undefined;
  const serviceSpecificTermsContent = reservationUnit?.serviceSpecificTerms
    ? getTranslation(reservationUnit.serviceSpecificTerms, "text")
    : undefined;

  const [cookiehubBannerHeight, setCookiehubBannerHeight] = useState<number>(0);
  const futurePricing =
    reservationUnit != null
      ? getFuturePricing(reservationUnit, activeApplicationRounds)
      : undefined;
  const formatters = getFormatters(i18n.language);
  const currentDate = focusDate ?? now;
  const dayStartTime = addHours(startOfDay(currentDate), 6);
  const equipment = filterNonNullable(reservationUnit?.equipments);

  const onScroll = () => {
    const banner: HTMLElement | null = window.document.querySelector(
      ".ch2 .ch2-dialog.ch2-visible"
    );
    const height: number = banner?.offsetHeight ?? 0;
    setCookiehubBannerHeight(height);
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).cookiehub) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const hash = router.asPath.split("#")[1];
    const scrollToCalendar = () => {
      if (calendarRef?.current?.parentElement?.offsetTop != null) {
        window.scroll({
          top: calendarRef.current.parentElement.offsetTop - 20,
          behavior: "smooth",
        });
      }
    };
    if (hash === "calendar" && focusSlot) {
      scrollToCalendar();
    }
  }, [focusSlot, router]);

  const nextAvailableTime = getNextAvailableTime({
    start: focusDate,
    reservableTimes,
    duration: durationValue,
    reservationUnit,
    activeApplicationRounds,
  });

  const LoginAndSubmit = useMemo(
    () => (
      <SubmitFragment
        focusSlot={focusSlot}
        apiBaseUrl={apiBaseUrl}
        actionCallback={() => storeReservationForLogin()}
        reservationForm={reservationForm}
        loadingText={t("reservationCalendar:makeReservationLoading")}
        buttonText={t("reservationCalendar:makeReservation")}
      />
    ),
    [apiBaseUrl, focusSlot, reservationForm, storeReservationForLogin, t]
  );

  if (reservationUnit == null) {
    return <CenterSpinner />;
  }
  const reservationControlProps = {
    reservationUnit,
    reservationForm,
    durationOptions,
    startingTimeOptions,
    focusSlot,
    submitReservation,
    LoginAndSubmit,
  };
  return (
    <Wrapper>
      <Head
        reservationUnit={reservationUnit}
        reservationUnitIsReservable={reservationUnitIsReservable}
        subventionSuffix={
          reservationUnit?.canApplyFreeOfCharge ? (
            <SubventionSuffix
              placement="reservation-unit-head"
              setIsDialogOpen={setIsDialogOpen}
            />
          ) : undefined
        }
      />
      <Container>
        <Columns>
          <RightColumn>
            {!isReservationStartInFuture(reservationUnit) &&
              reservationUnitIsReservable && (
                <QuickReservation
                  {...reservationControlProps}
                  subventionSuffix={
                    reservationUnit?.canApplyFreeOfCharge ? (
                      <SubventionSuffix
                        placement="reservation-unit-head"
                        setIsDialogOpen={setIsDialogOpen}
                      />
                    ) : undefined
                  }
                  nextAvailableTime={nextAvailableTime}
                />
              )}
            <JustForDesktop customBreakpoint={breakpoints.l}>
              <AddressSection reservationUnit={reservationUnit} />
            </JustForDesktop>
          </RightColumn>
          <div>
            <Subheading>{t("reservationUnit:description")}</Subheading>
            <Content data-testid="reservation-unit__description">
              <Sanitize html={getTranslation(reservationUnit, "description")} />
            </Content>
            {equipment?.length > 0 && (
              <>
                <Subheading>{t("reservationUnit:equipment")}</Subheading>
                <Content data-testid="reservation-unit__equipment">
                  <EquipmentList equipment={equipment} />
                </Content>
              </>
            )}
            {reservationUnitIsReservable && (
              <CalendarWrapper data-testid="reservation-unit__calendar--wrapper">
                <Subheading>
                  {t("reservations:reservationCalendar", {
                    title: getTranslation(reservationUnit, "name"),
                  })}
                </Subheading>
                {reservationUnit.maxReservationsPerUser &&
                  userReservations?.length != null &&
                  userReservations.length > 0 && (
                    <StyledNotification
                      $isSticky={isReservationQuotaReached}
                      type={isReservationQuotaReached ? "alert" : "info"}
                      label={t(
                        `reservationCalendar:reservationQuota${
                          isReservationQuotaReached ? "Full" : ""
                        }Label`
                      )}
                    >
                      <span data-testid="reservation-unit--notification__reservation-quota">
                        {t(
                          `reservationCalendar:reservationQuota${
                            isReservationQuotaReached ? "Full" : ""
                          }`,
                          {
                            count:
                              reservationUnit.numActiveUserReservations ?? 0,
                            total: reservationUnit.maxReservationsPerUser,
                          }
                        )}
                      </span>
                    </StyledNotification>
                  )}
                <div aria-hidden ref={calendarRef}>
                  <Calendar<ReservationNode>
                    events={[...calendarEvents, ...eventBuffers]}
                    begin={focusDate}
                    onNavigate={(d: Date) =>
                      reservationForm.setValue("date", toUIDate(d))
                    }
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
                    min={dayStartTime}
                    showToolbar
                    reservable={!isReservationQuotaReached}
                    toolbarComponent={Toolbar}
                    dateCellWrapperComponent={TouchCellWrapper}
                    // @ts-expect-error: TODO: fix this
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
                {!isReservationQuotaReached &&
                  !isReservationStartInFuture(reservationUnit) && (
                    <CalendarFooter
                      $cookiehubBannerHeight={cookiehubBannerHeight}
                    >
                      <ReservationCalendarControls
                        {...reservationControlProps}
                        mode="create"
                        isAnimated={isMobile}
                      />
                    </CalendarFooter>
                  )}
                <Legend />
              </CalendarWrapper>
            )}
            <ReservationInfoContainer
              reservationUnit={reservationUnit}
              reservationUnitIsReservable={reservationUnitIsReservable}
            />
            {termsOfUseContent && (
              <Accordion
                heading={t("reservationUnit:terms")}
                theme="thin"
                data-testid="reservation-unit__reservation-notice"
              >
                <PaddedContent>
                  {futurePricing && (
                    <p style={{ marginTop: 0 }}>
                      <Trans
                        i18nKey="reservationUnit:futurePricingNotice"
                        defaults="Huomioi <bold>hinnoittelumuutos {{date}} alkaen. Uusi hinta on {{price}}</bold>."
                        values={{
                          date: toUIDate(new Date(futurePricing.begins)),
                          price: getPrice({
                            pricing: futurePricing,
                            trailingZeros: true,
                          }).toLocaleLowerCase(),
                        }}
                        components={{ bold: <strong /> }}
                      />
                      {futurePricing.pricingType === PricingType.Paid &&
                        parseFloat(futurePricing.taxPercentage?.value ?? "") >
                          0 && (
                          <strong>
                            {t("reservationUnit:futurePriceNoticeTax", {
                              tax: formatters.strippedDecimal.format(
                                parseFloat(
                                  futurePricing.taxPercentage?.value ?? ""
                                )
                              ),
                            })}
                          </strong>
                        )}
                      .
                    </p>
                  )}
                  <Sanitize html={termsOfUseContent} />
                </PaddedContent>
              </Accordion>
            )}
            {shouldDisplayApplicationRoundTimeSlots && (
              <Accordion heading={t("reservationUnit:recurringHeading")}>
                <PaddedContent>
                  <p>{t("reservationUnit:recurringBody")}</p>
                  {applicationRoundTimeSlots?.map((day) => (
                    <ApplicationRoundScheduleDay key={day.weekday} {...day} />
                  ))}
                </PaddedContent>
              </Accordion>
            )}
            {reservationUnit.unit?.tprekId && (
              <Accordion heading={t("common:location")} theme="thin" open>
                <JustForMobile customBreakpoint={breakpoints.l}>
                  <AddressSection reservationUnit={reservationUnit} />
                </JustForMobile>
                <MapWrapper>
                  <MapComponent tprekId={reservationUnit.unit?.tprekId ?? ""} />
                </MapWrapper>
              </Accordion>
            )}
            {(paymentTermsContent || cancellationTermsContent) && (
              <Accordion
                heading={t(
                  `reservationUnit:${
                    paymentTermsContent
                      ? "paymentAndCancellationTerms"
                      : "cancellationTerms"
                  }`
                )}
                theme="thin"
                data-testid="reservation-unit__payment-and-cancellation-terms"
              >
                <PaddedContent>
                  {paymentTermsContent && (
                    <Sanitize
                      html={paymentTermsContent}
                      style={{ marginBottom: "var(--spacing-m)" }}
                    />
                  )}
                  <Sanitize html={cancellationTermsContent ?? ""} />
                </PaddedContent>
              </Accordion>
            )}
            {shouldDisplayPricingTerms && pricingTermsContent && (
              <Accordion
                heading={t("reservationUnit:pricingTerms")}
                theme="thin"
                data-testid="reservation-unit__pricing-terms"
              >
                <PaddedContent>
                  <Sanitize html={pricingTermsContent} />
                </PaddedContent>
              </Accordion>
            )}
            <Accordion
              heading={t("reservationUnit:termsOfUse")}
              theme="thin"
              data-testid="reservation-unit__terms-of-use"
            >
              <PaddedContent>
                {serviceSpecificTermsContent && (
                  <Sanitize
                    html={serviceSpecificTermsContent}
                    style={{ marginBottom: "var(--spacing-m)" }}
                  />
                )}
                <Sanitize
                  html={getTranslation(termsOfUse.genericTerms ?? {}, "text")}
                />
              </PaddedContent>
            </Accordion>
          </div>
        </Columns>
        <InfoDialog
          id="pricing-terms"
          heading={t("reservationUnit:pricingTerms")}
          text={pricingTermsContent ?? ""}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      </Container>
      <BottomWrapper>
        {shouldDisplayBottomWrapper && (
          <BottomContainer>
            <Subheading>
              {t("reservationUnit:relatedReservationUnits")}
            </Subheading>
            <RelatedUnits units={relatedReservationUnits} />
          </BottomContainer>
        )}
      </BottomWrapper>
      {errorMsg && (
        <ErrorToast
          title={t("reservationUnit:reservationFailed")}
          onClose={() => setErrorMsg(null)}
          error={errorMsg}
        />
      )}
    </Wrapper>
  );
};

export default ReservationUnit;
