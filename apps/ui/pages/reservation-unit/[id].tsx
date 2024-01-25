import React, {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GetServerSideProps } from "next";
import { Trans, useTranslation } from "next-i18next";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import {
  addHours,
  addSeconds,
  addYears,
  differenceInMinutes,
  startOfDay,
} from "date-fns";
import { toApiDate, toUIDate } from "common/src/common/util";
import {
  getEventBuffers,
  getNewReservation,
  getSlotPropGetter,
  getTimeslots,
  isReservationStartInFuture,
  isReservationUnitReservable,
  RoundPeriod,
} from "common/src/calendar/util";
import { Container, formatters as getFormatters } from "common";
import { useLocalStorage, useMedia, useSessionStorage } from "react-use";
import { breakpoints } from "common/src/common/style";
import Calendar, { CalendarEvent } from "common/src/calendar/Calendar";
import { Toolbar } from "common/src/calendar/Toolbar";
import classNames from "classnames";
import { PendingReservation } from "common/types/common";
import {
  ApplicationRoundStatusChoice,
  ApplicationRoundTimeSlotNode,
  Query,
  QueryReservationsArgs,
  QueryReservationUnitByPkArgs,
  QueryReservationUnitsArgs,
  QueryTermsOfUseArgs,
  ReservationCreateMutationInput,
  ReservationCreateMutationPayload,
  ReservationsReservationStateChoices,
  ReservationType,
  ReservationUnitByPkType,
  ReservationUnitByPkTypeReservableTimeSpansArgs,
  ReservationUnitByPkTypeReservationsArgs,
  ReservationUnitsReservationUnitPricingPricingTypeChoices,
  ReservationUnitType,
  TermsOfUseTermsOfUseTermsTypeChoices,
  TermsOfUseType,
} from "common/types/gql-types";
import { filterNonNullable, getLocalizationLang } from "common/src/helpers";
import Head from "../../components/reservation-unit/Head";
import Address from "../../components/reservation-unit/Address";
import Sanitize from "../../components/common/Sanitize";
import RelatedUnits from "../../components/reservation-unit/RelatedUnits";
import { AccordionWithState as Accordion } from "../../components/common/Accordion";
import { createApolloClient } from "@/modules/apolloClient";
import { Map } from "@/components/Map";
import Legend from "@/components/calendar/Legend";
import ReservationCalendarControls from "@/components/calendar/ReservationCalendarControls";
import {
  formatDurationMinutes,
  getTranslation,
  isTouchDevice,
  printErrorMessages,
} from "@/modules/util";
import {
  OPENING_HOURS,
  RELATED_RESERVATION_UNITS,
  RESERVATION_UNIT,
  TERMS_OF_USE,
} from "@/modules/queries/reservationUnit";
import { ReservationProps } from "@/context/DataContext";
import {
  CREATE_RESERVATION,
  LIST_RESERVATIONS,
} from "@/modules/queries/reservation";
import {
  createMockOpeningTimes,
  getFuturePricing,
  getPrice,
  isReservationUnitPaidInFuture,
  isReservationUnitPublished,
} from "@/modules/reservationUnit";
import EquipmentList from "../../components/reservation-unit/EquipmentList";
import { JustForDesktop, JustForMobile } from "@/modules/style/layout";
import { isReservationReservable } from "@/modules/reservation";
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
import QuickReservation, {
  type QuickReservationSlotProps,
} from "@/components/reservation-unit/QuickReservation";
import ReservationInfoContainer from "@/components/reservation-unit/ReservationInfoContainer";
import { useCurrentUser } from "@/hooks/user";
import { genericTermsVariant } from "@/modules/const";
import { APPLICATION_ROUNDS_PERIODS } from "@/modules/queries/applicationRound";
import { CenterSpinner } from "@/components/common/common";
import { getCommonServerSideProps } from "@/modules/serverUtils";

type Props = {
  reservationUnit: ReservationUnitByPkType | null;
  relatedReservationUnits: ReservationUnitType[];
  activeApplicationRounds: RoundPeriod[];
  termsOfUse: Record<string, TermsOfUseType>;
  apiBaseUrl: string;
  isPostLogin?: boolean;
  mapboxToken?: string;
};

type WeekOptions = "day" | "week" | "month";

type ReservationStateWithInitial = string;

const allowedReservationStates: ReservationsReservationStateChoices[] = [
  ReservationsReservationStateChoices.Created,
  ReservationsReservationStateChoices.Confirmed,
  ReservationsReservationStateChoices.RequiresHandling,
  ReservationsReservationStateChoices.WaitingForPayment,
];

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { params, query, locale } = ctx;
  const id = Number(params?.id);
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
    .filter((n) => n?.reservationUnits?.find((x) => x?.pk === id));

  if (id) {
    const { data: reservationUnitData } = await apolloClient.query<
      Query,
      QueryReservationUnitByPkArgs
    >({
      query: RESERVATION_UNIT,
      fetchPolicy: "no-cache",
      variables: {
        pk: id,
      },
    });

    const previewPass = uuid === reservationUnitData.reservationUnitByPk?.uuid;

    const reservationUnit =
      reservationUnitData?.reservationUnitByPk ?? undefined;
    if (!isReservationUnitPublished(reservationUnit) && !previewPass) {
      return {
        props: {
          ...commonProps,
        },
        notFound: true,
      };
    }

    const isDraft = reservationUnitData.reservationUnitByPk?.isDraft;
    if (isDraft && !previewPass) {
      return {
        props: {
          ...commonProps,
        },
        notFound: true,
      };
    }

    const { data: genericTermsData } = await apolloClient.query<
      Query,
      QueryTermsOfUseArgs
    >({
      query: TERMS_OF_USE,
      fetchPolicy: "no-cache",
      variables: {
        termsType: TermsOfUseTermsOfUseTermsTypeChoices.GenericTerms,
      },
    });
    const bookingTerms: TermsOfUseType | null =
      genericTermsData.termsOfUse?.edges
        ?.map((e) => e?.node)
        .filter((n): n is NonNullable<typeof n> => n != null)
        .find((edge) => edge.pk === genericTermsVariant.BOOKING) ?? null;

    const startDate = today;
    const endDate = addYears(today, 2);
    const { data: additionalData } = await apolloClient.query<
      Query,
      QueryReservationUnitByPkArgs &
        ReservationUnitByPkTypeReservableTimeSpansArgs &
        ReservationUnitByPkTypeReservationsArgs
    >({
      query: OPENING_HOURS,
      fetchPolicy: "no-cache",
      variables: {
        pk: id,
        startDate: String(toApiDate(startDate)),
        endDate: String(toApiDate(endDate)),
        from: toApiDate(startDate),
        to: toApiDate(endDate),
        state: allowedReservationStates,
        includeWithSameComponents: true,
      },
    });

    if (reservationUnitData.reservationUnitByPk?.unit?.pk) {
      const { data: relatedReservationUnitsData } = await apolloClient.query<
        Query,
        QueryReservationUnitsArgs
      >({
        query: RELATED_RESERVATION_UNITS,
        variables: {
          unit: [reservationUnitData.reservationUnitByPk.unit.pk],
          isDraft: false,
          isVisible: true,
        },
      });

      relatedReservationUnits = filterNonNullable(
        relatedReservationUnitsData?.reservationUnits?.edges?.map(
          (n) => n?.node
        )
      ).filter((n) => n?.pk !== reservationUnitData.reservationUnitByPk?.pk);
    }

    if (!reservationUnitData.reservationUnitByPk?.pk) {
      return {
        notFound: true,
      };
    }

    const allowReservationsWithoutOpeningHours =
      reservationUnitData?.reservationUnitByPk
        ?.allowReservationsWithoutOpeningHours;

    const timespans = filterNonNullable(
      additionalData.reservationUnitByPk?.reservableTimeSpans
    );
    const reservableTimeSpans = !allowReservationsWithoutOpeningHours
      ? [
          ...timespans,
          ...(reservationUnitData.reservationUnitByPk?.reservableTimeSpans ??
            []),
        ]
      : createMockOpeningTimes(id);

    return {
      props: {
        key: `${id}-${locale}`,
        ...commonProps,
        ...(await serverSideTranslations(locale ?? "fi")),
        reservationUnit: {
          ...reservationUnitData?.reservationUnitByPk,
          reservableTimeSpans,
          reservations:
            additionalData?.reservationUnitByPk?.reservations?.filter(
              (n) => n
            ) || [],
        },
        relatedReservationUnits,
        activeApplicationRounds,
        termsOfUse: { genericTerms: bookingTerms },
        isPostLogin: query?.isPostLogin === "true",
      },
    };
  }

  return {
    props: {
      key: `${id}-${locale}`,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
      paramsId: id,
    },
  };
};

const Columns = styled(TwoColumnLayout)`
  > div:first-of-type {
    order: 1;
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

  const eventPk = event != null && "pk" in event ? event.pk : Number(event?.id);
  const isOwn =
    eventPk != null &&
    !Number.isNaN(eventPk) &&
    ownReservations?.includes(eventPk) &&
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
        {t(`common:weekDayLong.${weekday}`)}
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
  mapboxToken,
  apiBaseUrl,
}: Props): JSX.Element | null => {
  const { t, i18n } = useTranslation();

  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);

  const router = useRouter();

  const [, setPendingReservation] =
    useSessionStorage<PendingReservation | null>("pendingReservation", null);

  const now = useMemo(() => new Date(), []);

  const [focusDate, setFocusDate] = useState(new Date());
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");
  const [initialReservation, setInitialReservation] =
    useState<PendingReservation | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shouldUnselect, setShouldUnselect] = useState(0);
  const [storedReservation, , removeStoredReservation] =
    useLocalStorage<PendingReservation>("reservation");

  const calendarRef = useRef<HTMLDivElement>(null);
  const openPricingTermsRef = useRef<HTMLAnchorElement>(null);
  const hash = router.asPath.split("#")[1];

  const isClientATouchDevice = isTouchDevice();

  useEffect(() => {
    const scrollToCalendar = () => {
      if (calendarRef?.current?.parentElement?.offsetTop != null) {
        window.scroll({
          top: calendarRef.current.parentElement.offsetTop - 20,
          behavior: "smooth",
        });
      }
    };

    if (
      storedReservation?.reservationUnitPk === reservationUnit?.pk &&
      storedReservation?.begin &&
      storedReservation?.end
    ) {
      setFocusDate(new Date(storedReservation.begin));
      scrollToCalendar();
      setInitialReservation(storedReservation);
      removeStoredReservation();
    } else if (hash === "calendar" && initialReservation) {
      scrollToCalendar();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReservation]);

  const { currentUser } = useCurrentUser();

  // TODO add pagination
  // TODO also combine with other instances of LIST_RESERVATIONS
  const { data: userReservationsData } = useQuery<Query, QueryReservationsArgs>(
    LIST_RESERVATIONS,
    {
      fetchPolicy: "no-cache",
      skip: !currentUser || !reservationUnit?.pk,
      variables: {
        begin: now.toISOString(),
        user: currentUser?.pk?.toString(),
        reservationUnit: [reservationUnit?.pk?.toString() ?? ""],
        state: allowedReservationStates,
      },
    }
  );

  const userReservations = filterNonNullable(
    userReservationsData?.reservations?.edges?.map((e) => e?.node)
  );
  const reservableTimeSpans = useMemo(
    () => filterNonNullable(reservationUnit?.reservableTimeSpans),
    [reservationUnit?.reservableTimeSpans]
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

  const shouldDisplayApplicationRoundTimeSlots =
    !!activeApplicationRounds?.length;

  // TODO: should this be sorted here?
  const applicationRoundTimeSlots = (
    reservationUnit?.applicationRoundTimeSlots ?? []
  ).sort((a, b) => a.weekday - b.weekday);
  const orderedApplicationRoundTimeSlots =
    applicationRoundTimeSlots[0]?.weekday === 0
      ? [...applicationRoundTimeSlots.slice(1), applicationRoundTimeSlots[0]]
      : applicationRoundTimeSlots;

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

  const handleCalendarEventChange = useCallback(
    (
      { start, end }: CalendarEvent<ReservationType>,
      skipLengthCheck = false
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
      setInitialReservation(newReservation);

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
    ]
  );

  const handleSlotClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO Calendar prop typing
    ({ start, end, action }: any, skipLengthCheck = false): boolean => {
      const isTouchClick = action === "select" && isClientATouchDevice;

      if (action === "select" && !isClientATouchDevice) {
        return false;
      }

      if (isReservationQuotaReached) {
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

      if (!reservationUnit) {
        return false;
      }
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

      setIsReserving(false);
      setInitialReservation(newReservation);

      return true;
    },
    [
      isClientATouchDevice,
      isReservationQuotaReached,
      isSlotReservable,
      reservationUnit,
      setInitialReservation,
    ]
  );

  useEffect(() => {
    setCalendarViewType(isMobile ? "day" : "week");
  }, [isMobile]);

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

  const shouldDisplayBottomWrapper = useMemo(
    () => relatedReservationUnits?.length > 0,
    [relatedReservationUnits?.length]
  );

  const calendarEvents: CalendarEvent<ReservationType>[] = useMemo(() => {
    const diff =
      initialReservation != null
        ? differenceInMinutes(
            new Date(initialReservation.end),
            new Date(initialReservation.begin)
          )
        : 0;
    const duration = diff >= 90 ? `(${formatDurationMinutes(diff)})` : "";

    const existingReservations = filterNonNullable(
      reservationUnit?.reservations
    );
    return [
      ...existingReservations,
      ...(initialReservation != null
        ? [
            {
              ...initialReservation,
              state: "INITIAL",
            },
          ]
        : []),
    ]
      .filter((n): n is NonNullable<typeof n> => n != null)
      .map((n) => {
        const suffix = n.state === "INITIAL" ? duration : "";
        const event: CalendarEvent<ReservationType> = {
          title: `${
            n.state === "CANCELLED"
              ? `${t("reservationCalendar:prefixForCancelled")}: `
              : suffix
          }`,
          start: n.begin != null ? new Date(n.begin) : new Date(),
          end: n.end != null ? new Date(n.end) : new Date(),
          allDay: false,
          // TODO refactor and remove modifying the state
          event: n as ReservationType,
        };

        return event;
      });
  }, [reservationUnit, t, initialReservation]);

  const eventBuffers = useMemo(() => {
    return getEventBuffers([
      ...calendarEvents
        .flatMap((e) => e.event)
        .filter((n): n is NonNullable<typeof n> => n != null),
      {
        begin: initialReservation?.begin,
        end: initialReservation?.end,
        state: "INITIAL",
        bufferTimeBefore: reservationUnit?.bufferTimeBefore?.toString(),
        bufferTimeAfter: reservationUnit?.bufferTimeAfter?.toString(),
      } as PendingReservation,
    ]);
  }, [calendarEvents, initialReservation, reservationUnit]);

  const [addReservation] = useMutation<
    { createReservation: ReservationCreateMutationPayload },
    { input: ReservationCreateMutationInput }
  >(CREATE_RESERVATION, {
    onCompleted: (data) => {
      if (
        initialReservation == null ||
        data.createReservation == null ||
        data.createReservation.pk == null
      ) {
        return;
      }
      setPendingReservation({
        ...initialReservation,
        pk: data.createReservation.pk,
        price: data.createReservation.price?.toString() ?? undefined,
      });
      if (reservationUnit?.pk != null) {
        router.push(`/reservation-unit/${reservationUnit?.pk}/reservation`);
      }
    },
    onError: (error) => {
      const msg = printErrorMessages(error);
      setErrorMsg(msg || t("errors:general_error"));
    },
  });

  const createReservation = useCallback(
    (res: ReservationProps): void => {
      setErrorMsg(null);
      setIsReserving(true);
      const { begin, end } = res;
      if (reservationUnit?.pk == null || begin == null || end == null) {
        return;
      }
      const input: ReservationCreateMutationInput = {
        begin,
        end,
        reservationUnitPks: [reservationUnit.pk],
      };

      setInitialReservation({
        begin,
        end,
      });

      addReservation({
        variables: {
          input,
        },
      });
    },
    [addReservation, reservationUnit?.pk, setInitialReservation]
  );

  const [isReservable, reason] = isReservationUnitReservable(reservationUnit);
  if (!isReservable) {
    // eslint-disable-next-line no-console
    console.warn("not reservable because: ", reason);
  }

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

  const [quickReservationSlot, setQuickReservationSlot] =
    useState<QuickReservationSlotProps | null>(null);

  const [cookiehubBannerHeight, setCookiehubBannerHeight] = useState<number>(0);

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

  const onScroll = () => {
    const banner: HTMLElement | null = window.document.querySelector(
      ".ch2 .ch2-dialog.ch2-visible"
    );
    const height: number = banner?.offsetHeight ?? 0;
    setCookiehubBannerHeight(height);
  };

  // Update the calendar to reflect a selected quick reservation slot
  useEffect(() => {
    if (quickReservationSlot == null) return;
    handleCalendarEventChange({
      start: quickReservationSlot.start,
      end: quickReservationSlot.end,
    });
  }, [handleCalendarEventChange, quickReservationSlot]);

  // Update quickReservation widget to reflect a changed calendar time, thus unselecting any quick reservation slot
  useEffect(() => {
    if (
      quickReservationSlot &&
      initialReservation &&
      initialReservation.begin &&
      initialReservation.end &&
      (quickReservationSlot.start.toISOString() !== initialReservation.begin ||
        quickReservationSlot.end.toISOString() !== initialReservation.end)
    ) {
      setShouldUnselect((prev) => prev + 1);
    }
    // If user resets the calendar/unselects a slot, unselect the quick reservation slot
    if (quickReservationSlot && !initialReservation) {
      setShouldUnselect((prev) => prev + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReservation, setShouldUnselect, setQuickReservationSlot]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).cookiehub) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const futurePricing =
    reservationUnit != null
      ? getFuturePricing(reservationUnit, activeApplicationRounds)
      : undefined;
  const formatters = getFormatters(i18n.language);
  const currentDate = focusDate ?? now;
  const dayStartTime = addHours(startOfDay(currentDate), 6);
  const equipment = filterNonNullable(reservationUnit?.equipment);

  if (reservationUnit == null) {
    return <CenterSpinner />;
  }

  return (
    <Wrapper>
      <Head
        reservationUnit={reservationUnit}
        isReservable={isReservable}
        subventionSuffix={
          reservationUnit?.canApplyFreeOfCharge ? (
            <SubventionSuffix
              placement="reservation-unit-head"
              ref={openPricingTermsRef}
              setIsDialogOpen={setIsDialogOpen}
            />
          ) : undefined
        }
      />
      <Container>
        <Columns>
          <div>
            {!isReservationStartInFuture(reservationUnit) && isReservable && (
              <QuickReservation
                isSlotReservable={isSlotReservable}
                isReservationUnitReservable={!isReservationQuotaReached}
                createReservation={createReservation}
                reservationUnit={reservationUnit}
                calendarRef={calendarRef}
                setErrorMsg={setErrorMsg}
                subventionSuffix={
                  reservationUnit?.canApplyFreeOfCharge
                    ? () => (
                        <SubventionSuffix
                          placement="quick-reservation"
                          ref={openPricingTermsRef}
                          setIsDialogOpen={setIsDialogOpen}
                        />
                      )
                    : undefined
                }
                shouldUnselect={shouldUnselect}
                quickReservationSlot={quickReservationSlot}
                setQuickReservationSlot={setQuickReservationSlot}
                setInitialReservation={setInitialReservation}
                apiBaseUrl={apiBaseUrl}
              />
            )}
            <JustForDesktop customBreakpoint={breakpoints.l}>
              <Address reservationUnit={reservationUnit} />
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
            {isReservable && (
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
                    begin={currentDate}
                    onNavigate={(d: Date) => setFocusDate(d)}
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
                    draggable={
                      !isReservationQuotaReached && !isClientATouchDevice
                    }
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
                        initialReservation={initialReservation}
                        setInitialReservation={setInitialReservation}
                        isSlotReservable={isSlotReservable}
                        isReserving={isReserving}
                        setCalendarFocusDate={setFocusDate}
                        activeApplicationRounds={activeApplicationRounds}
                        createReservation={(res) => createReservation(res)}
                        setErrorMsg={setErrorMsg}
                        handleEventChange={handleCalendarEventChange}
                        mode="create"
                        shouldCalendarControlsBeVisible={
                          shouldCalendarControlsBeVisible
                        }
                        setShouldCalendarControlsBeVisible={
                          setShouldCalendarControlsBeVisible
                        }
                        apiBaseUrl={apiBaseUrl}
                        isAnimated={isMobile}
                      />
                    </CalendarFooter>
                  )}
                <Legend />
              </CalendarWrapper>
            )}
            <ReservationInfoContainer
              reservationUnit={reservationUnit}
              isReservable={isReservable}
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
                      {futurePricing.pricingType ===
                        ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid &&
                        parseFloat(futurePricing.taxPercentage?.value) > 0 && (
                          <strong>
                            {t("reservationUnit:futurePriceNoticeTax", {
                              tax: formatters.strippedDecimal.format(
                                parseFloat(futurePricing.taxPercentage.value)
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
                  {orderedApplicationRoundTimeSlots.map((day) => (
                    <ApplicationRoundScheduleDay key={day.weekday} {...day} />
                  ))}
                </PaddedContent>
              </Accordion>
            )}
            {reservationUnit.unit?.location && (
              <Accordion heading={t("common:location")} theme="thin" open>
                <JustForMobile customBreakpoint={breakpoints.l}>
                  <Address reservationUnit={reservationUnit} />
                </JustForMobile>
                <MapWrapper>
                  <Map
                    title={getTranslation(reservationUnit.unit, "name")}
                    latitude={Number(reservationUnit.unit.location.latitude)}
                    longitude={Number(reservationUnit.unit.location.longitude)}
                    mapboxToken={mapboxToken}
                  />
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
                  html={getTranslation(termsOfUse.genericTerms, "text")}
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
