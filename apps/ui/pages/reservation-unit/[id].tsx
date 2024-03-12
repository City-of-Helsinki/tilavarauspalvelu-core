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
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import {
  addHours,
  addMinutes,
  addSeconds,
  addYears,
  differenceInMinutes,
  isToday,
  startOfDay,
} from "date-fns";
import {
  fromUIDate,
  isValidDate,
  toApiDate,
  toUIDate,
} from "common/src/common/util";
import {
  getEventBuffers,
  getNewReservation,
  getSlotPropGetter,
  getTimeslots,
  isReservationStartInFuture,
  isReservationUnitReservable,
} from "common/src/calendar/util";
import { Container, formatters as getFormatters } from "common";
import { useLocalStorage, useMedia } from "react-use";
import { breakpoints } from "common/src/common/style";
import Calendar, { CalendarEvent } from "common/src/calendar/Calendar";
import { Toolbar } from "common/src/calendar/Toolbar";
import classNames from "classnames";
import { PendingReservation } from "common/types/common";
import {
  ApplicationRoundStatusChoice,
  ApplicationRoundTimeSlotNode,
  PricingType,
  Query,
  QueryReservationsArgs,
  QueryReservationUnitArgs,
  QueryReservationUnitsArgs,
  ReservationCreateMutationInput,
  ReservationCreateMutationPayload,
  ReservationType,
  ReservationUnitType,
  State,
  ReservationUnitTypeReservableTimeSpansArgs,
  ReservationUnitTypeReservationsArgs,
} from "common/types/gql-types";
import {
  base64encode,
  filterNonNullable,
  fromMondayFirstUnsafe,
  getLocalizationLang,
} from "common/src/helpers";
import Head from "../../components/reservation-unit/Head";
import { AddressSection } from "@/components/reservation-unit/Address";
import Sanitize from "../../components/common/Sanitize";
import RelatedUnits from "../../components/reservation-unit/RelatedUnits";
import { AccordionWithState as Accordion } from "../../components/common/Accordion";
import { createApolloClient } from "@/modules/apolloClient";
import { Map } from "@/components/Map";
import Legend from "@/components/calendar/Legend";
import ReservationCalendarControls, {
  FocusTimeSlot,
} from "@/components/calendar/ReservationCalendarControls";
import {
  formatDuration,
  getSelectedOption,
  getTranslation,
  isTouchDevice,
  printErrorMessages,
} from "@/modules/util";
import {
  OPENING_HOURS,
  RELATED_RESERVATION_UNITS,
  RESERVATION_UNIT_QUERY,
} from "@/modules/queries/reservationUnit";
import {
  CREATE_RESERVATION,
  LIST_RESERVATIONS,
} from "@/modules/queries/reservation";
import {
  getFuturePricing,
  getPossibleTimesForDay,
  getPrice,
  getTimeString,
  isReservationUnitPaidInFuture,
  isReservationUnitPublished,
} from "@/modules/reservationUnit";
import EquipmentList from "../../components/reservation-unit/EquipmentList";
import { JustForDesktop, JustForMobile } from "@/modules/style/layout";
import {
  getDurationOptions,
  isReservationReservable,
} from "@/modules/reservation";
import SubventionSuffix from "../../components/reservation/SubventionSuffix";
import InfoDialog from "../../components/common/InfoDialog";
import {
  BottomContainer,
  BottomWrapper,
  CalendarFooter,
  CalendarWrapper,
  Content,
  Left,
  MapWrapper,
  PaddedContent,
  StyledNotification,
  Subheading,
  TwoColumnLayout,
  Wrapper,
} from "@/components/reservation-unit/ReservationUnitStyles";
import { Toast } from "@/components/common/Toast";
import QuickReservation from "@/components/reservation-unit/QuickReservation";
import ReservationInfoContainer from "@/components/reservation-unit/ReservationInfoContainer";
import { useCurrentUser } from "@/hooks/user";
import { APPLICATION_ROUNDS_PERIODS } from "@/modules/queries/applicationRound";
import { CenterSpinner } from "@/components/common/common";
import {
  getCommonServerSideProps,
  getGenericTerms,
} from "@/modules/serverUtils";
import { eventStyleGetter } from "@/components/common/calendarUtils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getNextAvailableTime } from "@/components/reservation-unit/utils";
import {
  PendingReservationFormSchema,
  PendingReservationFormType,
} from "@/components/reservation-unit/schema";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

type WeekOptions = "day" | "week" | "month";

const allowedReservationStates: State[] = [
  State.Created,
  State.Confirmed,
  State.RequiresHandling,
  State.WaitingForPayment,
];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { params, query, locale } = ctx;
  const pk = Number(params?.id);
  const uuid = query.ru;
  const today = new Date();
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  let relatedReservationUnits: ReservationUnitType[] = [];

  // TODO does this return only possible rounds or do we need to do frontend filtering on them?
  const { data } = await apolloClient.query<Query>({
    query: APPLICATION_ROUNDS_PERIODS,
  });
  const activeApplicationRounds = filterNonNullable(
    data?.applicationRounds?.edges?.map((e) => e?.node)
  )
    .filter((n) => n.status === ApplicationRoundStatusChoice.Open)
    .filter((n) => n?.reservationUnits?.find((x) => x?.pk === pk));

  if (pk) {
    const typename = "ReservationUnitType";
    const id = base64encode(`${typename}:${pk}`);
    const { data: reservationUnitData } = await apolloClient.query<
      Query,
      QueryReservationUnitArgs
    >({
      query: RESERVATION_UNIT_QUERY,
      fetchPolicy: "no-cache",
      variables: {
        id,
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

    const startDate = today;
    const endDate = addYears(today, 2);
    // TODO remove
    const { data: additionalData } = await apolloClient.query<
      Query,
      QueryReservationUnitArgs &
        ReservationUnitTypeReservableTimeSpansArgs &
        ReservationUnitTypeReservationsArgs
    >({
      query: OPENING_HOURS,
      fetchPolicy: "no-cache",
      variables: {
        id,
        startDate: String(toApiDate(startDate)),
        endDate: String(toApiDate(endDate)),
        from: toApiDate(startDate),
        to: toApiDate(endDate),
        state: allowedReservationStates,
        includeWithSameComponents: true,
      },
    });

    if (reservationUnit?.unit?.pk) {
      const { data: relatedReservationUnitsData } = await apolloClient.query<
        Query,
        QueryReservationUnitsArgs
      >({
        query: RELATED_RESERVATION_UNITS,
        variables: {
          unit: [reservationUnit.unit.pk],
          isDraft: false,
          isVisible: true,
        },
      });

      relatedReservationUnits = filterNonNullable(
        relatedReservationUnitsData?.reservationUnits?.edges?.map(
          (n) => n?.node
        )
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

    const timespans = filterNonNullable(
      additionalData.reservationUnit?.reservableTimeSpans
    );
    const moreTimespans = filterNonNullable(
      reservationUnitData.reservationUnit?.reservableTimeSpans
    );
    const reservableTimeSpans = [...timespans, ...moreTimespans];
    const { date, time, duration } = query;
    const reservations = filterNonNullable(
      additionalData?.reservationUnit?.reservations
    );
    return {
      props: {
        key: `${pk}-${locale}`,
        ...commonProps,
        ...(await serverSideTranslations(locale ?? "fi")),
        reservationUnit: {
          ...reservationUnit,
          reservableTimeSpans,
          reservations,
        },
        relatedReservationUnits,
        activeApplicationRounds,
        termsOfUse: { genericTerms: bookingTerms },
        isPostLogin: query?.isPostLogin === "true",
        searchDuration: Number.isNaN(Number(duration))
          ? null
          : Number(duration),
        searchDate: `${date}` ?? null,
        searchTime: `${time}` ?? null,
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
};

const Columns = styled(TwoColumnLayout)`
  > div:first-of-type {
    order: 1;
  }
`;

const EventWrapper = styled.div``;

const EventWrapperComponent = ({
  event,
  ...props
}: {
  event: CalendarEvent<ReservationType>;
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

// Returns an element for a weekday in the application round timetable, with up to two timespans
const ApplicationRoundScheduleDay = ({
  weekday,
  closed,
  reservableTimes,
}: ApplicationRoundTimeSlotNode) => {
  const { t } = useTranslation();
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
};

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
  const [isReserving, setIsReserving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);

  const hash = router.asPath.split("#")[1];

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
  const reservableTimeSpans = useMemo(
    () => filterNonNullable(reservationUnit?.reservableTimeSpans),
    [reservationUnit?.reservableTimeSpans]
  );
  const todaysTimeSpans = reservableTimeSpans.filter(
    (span) => span.startDatetime && isToday(new Date(span.startDatetime))
  );
  const searchUIDate = fromUIDate(searchDate);
  // TODO: plug in query parameters
  const initialFieldValues = {
    date:
      searchUIDate && isValidDate(searchUIDate)
        ? searchDate
        : toUIDate(new Date(todaysTimeSpans[0]?.startDatetime ?? "")),
    duration:
      searchDuration ??
      (reservationUnit.minReservationDuration
        ? reservationUnit.minReservationDuration / 60
        : 0),
    time:
      searchTime ??
      getTimeString(new Date(todaysTimeSpans[0]?.startDatetime ?? "")),
  };
  const reservationForm = useForm<PendingReservationFormType>({
    defaultValues: initialFieldValues,
    mode: "onChange",
    resolver: zodResolver(PendingReservationFormSchema),
  });
  const { watch, setValue } = reservationForm;
  const durationValue =
    watch("duration") ??
    (reservationUnit.minReservationDuration
      ? reservationUnit.minReservationDuration / 60
      : 0);
  const formDate = watch("date");
  const formUIDate = fromUIDate(formDate ?? "");
  const focusDate = new Date(formUIDate != null ? formUIDate : new Date());

  const timeValue = watch("time") ?? getTimeString();
  const submitReservation = (_data: PendingReservationFormType) => {
    if (focusSlot.start && focusSlot.end && reservationUnit.pk)
      setErrorMsg(null);
    setIsReserving(true);
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
  const focusSlot: FocusTimeSlot = useMemo(() => {
    const start = new Date(focusDate);
    const [hours, minutes] = timeValue.split(":").map(Number);
    start.setHours(hours, minutes, 0, 0);
    const end = addMinutes(start, durationValue);
    return {
      start,
      end,
      isReservable: isSlotReservable(start, end),
      durationMinutes: durationValue,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationValue, isSlotReservable, timeValue]);
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
  const availableTimesForDay = useMemo(() => {
    return getPossibleTimesForDay(
      reservableTimeSpans,
      reservationUnit?.reservationStartInterval,
      focusDate
    ).filter((span) => {
      const [slotH, slotM] = span.split(":").map(Number);
      const slotDate = new Date(focusDate);
      slotDate.setHours(slotH, slotM, 0, 0);
      return (
        slotDate >= now &&
        isSlotReservable(slotDate, addMinutes(slotDate, durationValue))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    reservableTimeSpans,
    reservationUnit?.reservationStartInterval,
    now,
    durationValue,
    isSlotReservable,
  ]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    reservableTimeSpans,
    reservationUnit?.reservationStartInterval,
    now,
    durationValue,
    isSlotReservable,
  ]);

  const selectedDuration = useMemo(
    () =>
      getSelectedOption(durationValue, durationOptions) ?? durationOptions[0],
    [durationValue, durationOptions]
  );

  const { currentUser } = useCurrentUser();

  // TODO add pagination
  // TODO also combine with other instances of LIST_RESERVATIONS
  const { data: userReservationsData } = useQuery<Query, QueryReservationsArgs>(
    LIST_RESERVATIONS,
    {
      fetchPolicy: "no-cache",
      skip: !currentUser || !reservationUnit?.pk,
      variables: {
        beginDate: toApiDate(now),
        user: currentUser?.pk?.toString(),
        reservationUnit: [reservationUnit?.pk?.toString() ?? ""],
        state: allowedReservationStates,
      },
    }
  );

  const userReservations = filterNonNullable(
    userReservationsData?.reservations?.edges?.map((e) => e?.node)
  );

  const slotPropGetter = useMemo(() => {
    return getSlotPropGetter({
      reservableTimeSpans,
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
    reservableTimeSpans,
    activeApplicationRounds,
    reservationUnit?.reservationBegins,
    reservationUnit?.reservationEnds,
    reservationUnit?.reservationsMinDaysBefore,
    reservationUnit?.reservationsMaxDaysBefore,
  ]);

  const isReservationQuotaReached = useMemo(() => {
    return (
      reservationUnit?.maxReservationsPerUser != null &&
      userReservations?.length != null &&
      userReservations?.length >= reservationUnit?.maxReservationsPerUser
    );
  }, [reservationUnit?.maxReservationsPerUser, userReservations]);

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

  const [shouldCalendarControlsBeVisible, setShouldCalendarControlsBeVisible] =
    useState(false);
  const isClientATouchDevice = isTouchDevice();
  const handleCalendarEventChange = useCallback(
    (
      { start, end }: CalendarEvent<ReservationType>,
      skipLengthCheck = true
    ): boolean => {
      if (!reservationUnit) {
        return false;
      }
      const newReservation = getNewReservation({ start, end, reservationUnit });

      if (
        !isSlotReservable(start, end, skipLengthCheck) ||
        isReservationQuotaReached
      ) {
        return false;
      }

      setIsReserving(false);
      setValue("date", newReservation.begin);
      setValue(
        "duration",
        differenceInMinutes(
          new Date(newReservation.begin),
          new Date(newReservation.end)
        )
      );

      if (isClientATouchDevice) {
        setShouldCalendarControlsBeVisible(true);
      }

      return true;
    },
    [
      isClientATouchDevice,
      isReservationQuotaReached,
      isSlotReservable,
      reservationUnit,
      setValue,
    ]
  );

  const handleSlotClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO Calendar prop typing
    ({ start, end, action }: any, skipLengthCheck = false): boolean => {
      const isTouchClick = action === "select" && isClientATouchDevice;

      if (
        (action === "select" && !isClientATouchDevice) ||
        isReservationQuotaReached ||
        !reservationUnit
      ) {
        return false;
      }

      const normalizedEnd =
        action === "click" ||
        (isTouchClick && differenceInMinutes(end, start) <= 30)
          ? addSeconds(
              new Date(start),
              reservationUnit?.minReservationDuration ?? 0
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

      setIsReserving(false); // why?
      setValue("date", toUIDate(new Date(newReservation.begin)));
      setValue(
        "duration",
        differenceInMinutes(
          new Date(newReservation.begin),
          new Date(newReservation.end)
        )
      );

      return true;
    },
    [
      isClientATouchDevice,
      isReservationQuotaReached,
      isSlotReservable,
      reservationUnit,
      setValue,
    ]
  );

  useEffect(() => {
    setCalendarViewType(isMobile ? "day" : "week");
  }, [isMobile]);

  const calendarEvents: CalendarEvent<ReservationType>[] = useMemo(() => {
    const diff =
      focusSlot?.durationMinutes != null ? focusSlot.durationMinutes : 0;
    const calendarDuration = diff >= 90 ? `(${formatDuration(diff, t)})` : "";

    const existingReservations = filterNonNullable(
      reservationUnit?.reservations
    );
    return [
      ...existingReservations,
      ...(focusSlot != null
        ? [
            {
              begin: focusSlot.start,
              end: focusSlot.end,
              state: "INITIAL",
            },
          ]
        : []),
    ]
      .filter((n): n is NonNullable<typeof n> => n != null)
      .map((n) => {
        const suffix = n.state === "INITIAL" ? calendarDuration : "";
        const { begin: start, end } = n;
        const event: CalendarEvent<ReservationType> = {
          title: `${
            n.state === "CANCELLED"
              ? `${t("reservationCalendar:prefixForCancelled")}: `
              : suffix
          }`,
          start: new Date(start ?? ""),
          end: new Date(end ?? ""),
          allDay: false,
          // TODO refactor and remove modifying the state
          event: n as ReservationType,
        };

        return event;
      });
  }, [reservationUnit, t, focusSlot]);

  const eventBuffers = useMemo(() => {
    const bufferTimeBefore =
      reservationUnit?.bufferTimeBefore != null &&
      reservationUnit.bufferTimeBefore !== 0
        ? reservationUnit?.bufferTimeBefore.toString()
        : undefined;
    const bufferTimeAfter =
      reservationUnit?.bufferTimeAfter != null &&
      reservationUnit.bufferTimeAfter !== 0
        ? reservationUnit?.bufferTimeAfter.toString()
        : undefined;
    return getEventBuffers([
      ...calendarEvents
        .flatMap((e) => e.event)
        .filter((n): n is NonNullable<typeof n> => n != null),
      {
        begin: toUIDate(focusSlot?.start),
        end: toUIDate(focusSlot?.end),
        state: "INITIAL",
        bufferTimeBefore,
        bufferTimeAfter,
      } as PendingReservation,
    ]);
  }, [calendarEvents, focusSlot, reservationUnit]);

  // TODO: Refactor to try/catch
  const [addReservation] = useMutation<
    { createReservation: ReservationCreateMutationPayload },
    { input: ReservationCreateMutationInput }
  >(CREATE_RESERVATION, {
    onCompleted: ({ createReservation }) => {
      const { pk } = createReservation;
      /// ??? errors
      if (focusSlot == null || pk == null) {
        return;
      }
      if (reservationUnit?.pk != null && pk != null) {
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
      setIsReserving(false);
    },
    [addReservation]
  );

  // store reservation unit overall reservability to use in JSX and pass to some child elements
  const [reservationUnitIsReservable, reason] =
    isReservationUnitReservable(reservationUnit);
  if (!reservationUnitIsReservable) {
    // eslint-disable-next-line no-console
    console.warn("not reservable because: ", reason);
  }
  const [storedReservation, setStoredReservation, _removeStoredReservation] =
    useLocalStorage<PendingReservation>("reservation");
  const storeReservationForLogin = () => {
    if (reservationUnit.pk != null && focusSlot != null) {
      const { start, end } = focusSlot ?? {};
      setStoredReservation({
        begin: toUIDate(start),
        end: toUIDate(end),
        price: undefined,
        reservationUnitPk: reservationUnit.pk ?? 0,
      });
    }
  };

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

  // IRRELEVANT STUFF (FOR ME/NOW)
  /*
useEffect(() => {
  const start = storedReservation?.begin
    ? new Date(storedReservation.begin)
    : null;
  const end = storedReservation?.end ? new Date(storedReservation.end) : null;

  if (start && end) {
    handleCalendarEventChange(
      { start, end } as CalendarEvent<ReservationType>,
      true
    );
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [storedReservation?.begin, storedReservation?.end]);
*/
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
  const equipment = filterNonNullable(reservationUnit?.equipment);

  // MYSTIC STUFF
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

  // This seems to be meant to scroll to the calendar if there's an initial reservation, and
  // ALSO if there's a stored reservation, set the focusDate to it, and
  // ALSO if there's a stored reservation, set it as the new initial reservation, and
  // ALSO remove the stored reservation if there is one. phew.
  useEffect(() => {
    const scrollToCalendar = () => {
      if (calendarRef?.current?.parentElement?.offsetTop != null) {
        window.scroll({
          top: calendarRef.current.parentElement.offsetTop - 20,
          behavior: "smooth",
        });
      }
    };
    /*
    // TODO: we shouldn't be setting values based on stored reservation here
    if (
      storedReservation?.reservationUnitPk === reservationUnit?.pk &&
      storedReservation?.begin &&
      storedReservation?.end
    ) {
      setFocusDate(new Date(storedReservation.begin));
      scrollToCalendar();
      setInitialReservation(storedReservation);
      removeStoredReservation();
    } else */
    if (hash === "calendar" && focusSlot) {
      scrollToCalendar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSlot]);

  // TODO: Should this be an _early_ return?
  if (reservationUnit == null) {
    return <CenterSpinner />;
  }
  const subventionSuffix = reservationUnit?.canApplyFreeOfCharge ? (
    <SubventionSuffix
      placement="reservation-unit-head"
      setIsDialogOpen={setIsDialogOpen}
    />
  ) : undefined;
  const nextAvailableTime = getNextAvailableTime({
    day: focusDate,
    slots: availableTimesForDay,
    duration: durationValue,
    isSlotReservable,
    reservationUnit,
  });
  const quickReservationProps = {
    reservationUnitIsReservable,
    reservationUnit,
    calendarRef,
    subventionSuffix,
    apiBaseUrl,
    reservationForm,
    durationOptions,
    startingTimeOptions,
    nextAvailableTime,
    focusSlot,
    selectedDuration,
    storeReservationForLogin,
    isReserving,
    submitReservation,
  };
  return (
    <Wrapper>
      <Head
        reservationUnit={reservationUnit}
        reservationUnitIsReservable={reservationUnitIsReservable}
        subventionSuffix={subventionSuffix}
      />
      <Container>
        <Columns>
          <div>
            {!isReservationStartInFuture(reservationUnit) &&
              reservationUnitIsReservable && (
                <QuickReservation {...quickReservationProps} />
              )}
            <JustForDesktop customBreakpoint={breakpoints.l}>
              <AddressSection reservationUnit={reservationUnit} />
            </JustForDesktop>
          </div>
          <Left>
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
                            count: userReservations?.length,
                            total: reservationUnit.maxReservationsPerUser,
                          }
                        )}
                      </span>
                    </StyledNotification>
                  )}
                <div aria-hidden ref={calendarRef}>
                  <Calendar<ReservationType>
                    events={[...calendarEvents, ...eventBuffers]}
                    begin={focusDate}
                    onNavigate={(d: Date) =>
                      reservationForm.setValue("date", d.toISOString())
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
                    onSelecting={(event: CalendarEvent<ReservationType>) =>
                      handleCalendarEventChange(event, true)
                    }
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
                    onEventDrop={handleCalendarEventChange}
                    onEventResize={handleCalendarEventChange}
                    onSelectSlot={handleSlotClick}
                    draggableAccessor={({ event }) =>
                      event?.state?.toString() === "INITIAL"
                    }
                    resizableAccessor={({ event }) =>
                      event?.state?.toString() === "INITIAL"
                    }
                    step={30}
                    timeslots={getTimeslots(
                      reservationUnit.reservationStartInterval
                    )}
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
                        reservationUnit={reservationUnit}
                        isReserving={isReserving}
                        mode="create"
                        shouldCalendarControlsBeVisible={
                          shouldCalendarControlsBeVisible
                        }
                        setShouldCalendarControlsBeVisible={
                          setShouldCalendarControlsBeVisible
                        }
                        apiBaseUrl={apiBaseUrl}
                        isAnimated={isMobile}
                        reservationForm={reservationForm}
                        durationOptions={durationOptions}
                        availableTimesForDay={availableTimesForDay}
                        focusSlot={focusSlot}
                        storeReservationForLogin={storeReservationForLogin}
                        startingTimeOptions={startingTimeOptions}
                        submitReservation={submitReservation}
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
                  <Map tprekId={reservationUnit.unit?.tprekId ?? ""} />
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
          </Left>
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
        <Toast
          type="error"
          label={t("reservationUnit:reservationFailed")}
          position="top-center"
          autoClose={false}
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg(null)}
          dismissible
          closeButtonLabelText={t("common:error.closeErrorMsg")}
          trapFocus
        >
          {errorMsg}
        </Toast>
      )}
    </Wrapper>
  );
};

export default ReservationUnit;
