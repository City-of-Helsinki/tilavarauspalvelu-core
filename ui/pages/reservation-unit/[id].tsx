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
  roundToNearestMinutes,
  startOfDay,
} from "date-fns";
import { toApiDate, toUIDate } from "common/src/common/util";
import {
  getEventBuffers,
  getMaxReservation,
  getSlotPropGetter,
  getTimeslots,
  isReservationShortEnough,
  isReservationStartInFuture,
  isReservationUnitReservable,
} from "common/src/calendar/util";
import { formatters as getFormatters } from "common";
import { useLocalStorage, useMedia, useSessionStorage } from "react-use";
import { breakpoints } from "common/src/common/style";
import Calendar, { CalendarEvent } from "common/src/calendar/Calendar";
import {
  ApplicationRound,
  PendingReservation,
  Reservation,
} from "common/types/common";
import {
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
  ReservationUnitByPkTypeOpeningHoursArgs,
  ReservationUnitByPkTypeReservationsArgs,
  ReservationUnitsReservationUnitPricingPricingTypeChoices,
  ReservationUnitType,
  ReservationUnitTypeEdge,
  TermsOfUseTermsOfUseTermsTypeChoices,
  TermsOfUseType,
} from "common/types/gql-types";
import Container from "../../components/common/Container";
import Head from "../../components/reservation-unit/Head";
import Address from "../../components/reservation-unit/Address";
import Sanitize from "../../components/common/Sanitize";
import RelatedUnits from "../../components/reservation-unit/RelatedUnits";
import { AccordionWithState as Accordion } from "../../components/common/Accordion";
import apolloClient from "../../modules/apolloClient";
import Map from "../../components/Map";
import Legend from "../../components/calendar/Legend";
import ReservationCalendarControls from "../../components/calendar/ReservationCalendarControls";
import {
  getTranslation,
  isTouchDevice,
  parseDate,
  printErrorMessages,
} from "../../modules/util";
import { Toolbar } from "../../components/calendar/Toolbar";
import {
  OPENING_HOURS,
  RELATED_RESERVATION_UNITS,
  RESERVATION_UNIT,
  TERMS_OF_USE,
} from "../../modules/queries/reservationUnit";
import { getApplicationRounds } from "../../modules/api";
import { ReservationProps } from "../../context/DataContext";
import {
  CREATE_RESERVATION,
  LIST_RESERVATIONS,
} from "../../modules/queries/reservation";
import {
  getFuturePricing,
  getPrice,
  isReservationUnitPaidInFuture,
  isReservationUnitPublished,
  mockOpeningTimePeriods,
  mockOpeningTimes,
} from "../../modules/reservationUnit";
import EquipmentList from "../../components/reservation-unit/EquipmentList";
import QuickReservation from "../../components/reservation-unit/QuickReservation";
import { JustForDesktop, JustForMobile } from "../../modules/style/layout";
import { CURRENT_USER } from "../../modules/queries/user";
import { isReservationReservable } from "../../modules/reservation";
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
} from "../../components/reservation-unit/ReservationUnitStyles";
import ReservationInfoContainer from "../../components/reservation-unit/ReservationInfoContainer";
import { Toast } from "../../styles/util";

type Props = {
  reservationUnit: ReservationUnitByPkType | null;
  relatedReservationUnits: ReservationUnitType[];
  activeApplicationRounds: ApplicationRound[];
  termsOfUse: Record<string, TermsOfUseType>;
};

type WeekOptions = "day" | "week" | "month";

type ReservationStateWithInitial = string;

const allowedReservationStates: ReservationsReservationStateChoices[] = [
  ReservationsReservationStateChoices.Created,
  ReservationsReservationStateChoices.Confirmed,
  ReservationsReservationStateChoices.RequiresHandling,
  ReservationsReservationStateChoices.WaitingForPayment,
];

export const getServerSideProps: GetServerSideProps = async ({
  locale,
  params,
  query,
}) => {
  const id = Number(params.id);
  const uuid = query.ru;
  const today: string = toApiDate(new Date());

  let relatedReservationUnits = [] as ReservationUnitType[];

  const applicationRounds = await getApplicationRounds();
  const activeApplicationRounds = applicationRounds.filter((applicationRound) =>
    applicationRound.reservationUnitIds.includes(id)
  );

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

    if (
      !isReservationUnitPublished(reservationUnitData.reservationUnitByPk) &&
      !previewPass
    ) {
      return {
        notFound: true,
      };
    }

    const isDraft = reservationUnitData.reservationUnitByPk?.isDraft;
    if (isDraft && !previewPass) {
      return {
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
    const genericTerms = genericTermsData.termsOfUse?.edges[0]?.node || {};

    const lastOpeningPeriodEndDate: string =
      reservationUnitData?.reservationUnitByPk?.openingHours?.openingTimePeriods
        .map((period) => period.endDate)
        .sort()
        .reverse()[0] || toApiDate(addYears(new Date(), 1));

    const { data: additionalData } = await apolloClient.query<
      Query,
      QueryReservationUnitByPkArgs &
        ReservationUnitByPkTypeOpeningHoursArgs &
        ReservationUnitByPkTypeReservationsArgs
    >({
      query: OPENING_HOURS,
      fetchPolicy: "no-cache",
      variables: {
        pk: id,
        startDate: today,
        endDate: lastOpeningPeriodEndDate,
        from: today,
        to: lastOpeningPeriodEndDate,
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
          unit: [String(reservationUnitData.reservationUnitByPk.unit.pk)],
          isDraft: false,
          isVisible: true,
        },
      });

      relatedReservationUnits =
        relatedReservationUnitsData?.reservationUnits?.edges
          .map((n: ReservationUnitTypeEdge) => n.node)
          .filter(
            (n: ReservationUnitType) =>
              n.pk !== reservationUnitData.reservationUnitByPk.pk
          ) || [];
    }

    if (!reservationUnitData.reservationUnitByPk?.pk) {
      return {
        notFound: true,
      };
    }

    const allowReservationsWithoutOpeningHours =
      reservationUnitData?.reservationUnitByPk
        ?.allowReservationsWithoutOpeningHours;

    return {
      props: {
        ...(await serverSideTranslations(locale)),
        key: id,
        reservationUnit: {
          ...reservationUnitData?.reservationUnitByPk,
          openingHours: {
            openingTimes: allowReservationsWithoutOpeningHours
              ? mockOpeningTimes
              : additionalData.reservationUnitByPk?.openingHours?.openingTimes.filter(
                  (n) => n.isReservable
                ) || [],
            openingTimePeriods: allowReservationsWithoutOpeningHours
              ? mockOpeningTimePeriods
              : reservationUnitData?.reservationUnitByPk?.openingHours
                  ?.openingTimePeriods || [],
          },
          reservations:
            additionalData?.reservationUnitByPk?.reservations?.filter(
              (n) => n
            ) || [],
        },
        relatedReservationUnits,
        activeApplicationRounds,
        termsOfUse: { genericTerms },
      },
    };
  }

  return {
    props: {
      ...(await serverSideTranslations(locale)),
      paramsId: id,
    },
  };
};

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
  if (event.event.state === "INITIAL") {
    const { start, end } = props.event;
    const diff = differenceInMinutes(end, start);
    if (diff <= 30) isSmall = true;
  }
  return <EventWrapper {...props} className={isSmall ? "isSmall" : ""} />;
};

const ReservationUnit = ({
  reservationUnit,
  relatedReservationUnits,
  activeApplicationRounds,
  termsOfUse,
}: Props): JSX.Element | null => {
  const { t, i18n } = useTranslation();

  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);

  const router = useRouter();

  const [, setPendingReservation] = useSessionStorage(
    "pendingReservation",
    null
  );

  const now = useMemo(() => new Date().toISOString(), []);

  const [userReservations, setUserReservations] = useState<
    ReservationType[] | null
  >(null);
  const [focusDate, setFocusDate] = useState(new Date());
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");
  const [initialReservation, setInitialReservation] =
    useState<PendingReservation | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [storedReservation, , removeStoredReservation] =
    useLocalStorage<PendingReservation>("reservation");

  const calendarRef = useRef(null);
  const openPricingTermsRef = useRef(null);
  const hash = router.asPath.split("#")[1];

  const isClientATouchDevice = isTouchDevice();

  const subventionSuffix = useCallback(
    (placement: "reservation-unit-head" | "quick-reservation") =>
      reservationUnit.canApplyFreeOfCharge ? (
        <SubventionSuffix
          placement={placement}
          ref={openPricingTermsRef}
          setIsDialogOpen={setIsDialogOpen}
        />
      ) : null,
    [reservationUnit.canApplyFreeOfCharge]
  );

  useEffect(() => {
    const scrollToCalendar = () =>
      window.scroll({
        top: calendarRef.current.offsetTop - 20,
        left: 0,
        behavior: "smooth",
      });

    if (storedReservation?.reservationUnitPk === reservationUnit.pk) {
      setFocusDate(new Date(storedReservation.begin));
      scrollToCalendar();
      setInitialReservation(storedReservation);
      removeStoredReservation();
    } else if (hash === "calendar" && initialReservation) {
      scrollToCalendar();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReservation]);

  const { data: userData } = useQuery<Query>(CURRENT_USER, {
    fetchPolicy: "no-cache",
  });

  const currentUser = useMemo(() => userData?.currentUser, [userData]);

  const { data: userReservationsData } = useQuery<Query, QueryReservationsArgs>(
    LIST_RESERVATIONS,
    {
      fetchPolicy: "no-cache",
      skip: !currentUser,
      variables: {
        begin: now,
        user: currentUser?.pk?.toString(),
        reservationUnit: [reservationUnit?.pk?.toString()],
        state: allowedReservationStates,
      },
    }
  );

  useEffect(() => {
    const reservations = userReservationsData?.reservations?.edges
      ?.map(({ node }) => node)
      .filter((n) => allowedReservationStates.includes(n.state));
    setUserReservations(reservations || []);
  }, [userReservationsData]);

  // const activeOpeningTimes = getActiveOpeningTimes(
  //   reservationUnit.openingHours?.openingTimePeriods
  // );

  const slotPropGetter = useMemo(
    () =>
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
    [
      reservationUnit.openingHours?.openingTimes,
      activeApplicationRounds,
      reservationUnit.reservationBegins,
      reservationUnit.reservationEnds,
      reservationUnit.reservationsMinDaysBefore,
    ]
  );

  const isReservationQuotaReached = useMemo(() => {
    return (
      reservationUnit.maxReservationsPerUser &&
      userReservations?.length >= reservationUnit.maxReservationsPerUser
    );
  }, [reservationUnit.maxReservationsPerUser, userReservations]);

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

  const shouldDisplayPricingTerms = useMemo(() => {
    return (
      reservationUnit.canApplyFreeOfCharge &&
      isReservationUnitPaidInFuture(reservationUnit.pricings)
    );
  }, [reservationUnit.canApplyFreeOfCharge, reservationUnit.pricings]);

  const [shouldCalendarControlsBeVisible, setShouldCalendarControlsBeVisible] =
    useState(false);

  const handleEventChange = useCallback(
    (
      { start, end }: CalendarEvent<Reservation | ReservationType>,
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
      } else if (
        !isSlotReservable(start, end, skipLengthCheck) ||
        isReservationQuotaReached
      ) {
        return false;
      }

      setIsReserving(false);
      setInitialReservation({
        begin: newReservation.begin,
        end: newReservation.end,
      } as PendingReservation);

      if (isClientATouchDevice) {
        setShouldCalendarControlsBeVisible(true);
      }

      return true;
    },
    [
      isClientATouchDevice,
      isReservationQuotaReached,
      isSlotReservable,
      reservationUnit.maxReservationDuration,
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

      if (isReservationQuotaReached) {
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

      setIsReserving(false);
      setInitialReservation({
        begin: startTime.toISOString(),
        end: normalizedEnd.toISOString(),
      } as PendingReservation);

      return true;
    },
    [
      isClientATouchDevice,
      isReservationQuotaReached,
      isSlotReservable,
      reservationUnit.minReservationDuration,
    ]
  );

  const TouchCellWrapper = ({ children, value, onSelectSlot }): JSX.Element => {
    return React.cloneElement(Children.only(children), {
      onTouchEnd: () => onSelectSlot({ action: "click", slots: [value] }),
      style: {
        className: `${children}`,
      },
    });
  };

  useEffect(() => {
    setCalendarViewType(isMobile ? "day" : "week");
  }, [isMobile]);

  useEffect(() => {
    const start = storedReservation?.begin
      ? new Date(storedReservation.begin)
      : null;
    const end = storedReservation?.end ? new Date(storedReservation.end) : null;

    if (start && end) {
      handleEventChange(
        { start, end } as CalendarEvent<Reservation | ReservationType>,
        true
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedReservation?.begin, storedReservation?.end]);

  const shouldDisplayBottomWrapper = useMemo(
    () => relatedReservationUnits?.length > 0,
    [relatedReservationUnits?.length]
  );

  const calendarEvents: CalendarEvent<Reservation | ReservationType>[] =
    useMemo(() => {
      return userReservations && reservationUnit?.reservations
        ? [
            ...reservationUnit.reservations,
            { ...initialReservation, state: "INITIAL" },
          ]
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
      ...calendarEvents.flatMap((e) => e.event),
      {
        begin: initialReservation?.begin,
        end: initialReservation?.end,
        state: "INITIAL",
        bufferTimeBefore: reservationUnit.bufferTimeBefore?.toString(),
        bufferTimeAfter: reservationUnit.bufferTimeAfter?.toString(),
      } as PendingReservation,
    ]);
  }, [calendarEvents, initialReservation, reservationUnit]);

  const [addReservation] = useMutation<
    { createReservation: ReservationCreateMutationPayload },
    { input: ReservationCreateMutationInput }
  >(CREATE_RESERVATION, {
    onCompleted: (data) => {
      setPendingReservation({
        ...initialReservation,
        pk: data.createReservation.pk,
        price: data.createReservation.price,
      });
      router.push(`/reservation-unit/${reservationUnit.pk}/reservation`);
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
    [addReservation, reservationUnit.pk, setInitialReservation]
  );

  const isReservable = useMemo(() => {
    return isReservationUnitReservable(reservationUnit);
  }, [reservationUnit]);

  const termsOfUseContent = useMemo(
    () => getTranslation(reservationUnit, "termsOfUse"),
    [reservationUnit]
  );

  const paymentTermsContent = useMemo(
    () => getTranslation(reservationUnit.paymentTerms, "text"),
    [reservationUnit]
  );

  const cancellationTermsContent = useMemo(
    () => getTranslation(reservationUnit.cancellationTerms, "text"),
    [reservationUnit]
  );

  const pricingTermsContent = useMemo(
    () => getTranslation(reservationUnit.pricingTerms, "text"),
    [reservationUnit]
  );

  const serviceSpecificTermsContent = useMemo(
    () => getTranslation(reservationUnit.serviceSpecificTerms, "text"),
    [reservationUnit]
  );

  const quickReservationComponent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (calendar: React.MutableRefObject<any>, type: "mobile" | "desktop") => {
      const scrollPosition = calendar?.current?.offsetTop
        ? calendar.current.offsetTop - 20
        : undefined;

      return (
        !isReservationStartInFuture(reservationUnit) &&
        isReservable && (
          <QuickReservation
            isSlotReservable={isSlotReservable}
            isReservationUnitReservable={!isReservationQuotaReached}
            createReservation={(res) => createReservation(res)}
            reservationUnit={reservationUnit}
            scrollPosition={scrollPosition}
            setErrorMsg={setErrorMsg}
            idPrefix={type}
            subventionSuffix={subventionSuffix}
          />
        )
      );
    },
    [
      createReservation,
      isReservationQuotaReached,
      isSlotReservable,
      reservationUnit,
      isReservable,
      subventionSuffix,
    ]
  );

  const [cookiehubBannerHeight, setCookiehubBannerHeight] = useState<
    number | null
  >(null);

  const onScroll = () => {
    const banner: HTMLElement = window.document.querySelector(
      ".ch2 .ch2-dialog.ch2-visible"
    );
    const height: number = banner?.offsetHeight;
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

  const futurePricing = useMemo(
    () => getFuturePricing(reservationUnit, activeApplicationRounds),
    [reservationUnit, activeApplicationRounds]
  );

  const formatters = useMemo(
    () => getFormatters(i18n.language),
    [i18n.language]
  );

  const currentDate = focusDate || new Date();

  const dayStartTime = addHours(startOfDay(currentDate), 6);

  return reservationUnit ? (
    <Wrapper>
      <Head
        reservationUnit={reservationUnit}
        // activeOpeningTimes={activeOpeningTimes}
        isReservable={isReservable}
        subventionSuffix={subventionSuffix}
      />
      <Container>
        <TwoColumnLayout>
          <Left>
            <JustForMobile customBreakpoint={breakpoints.l}>
              {quickReservationComponent(calendarRef, "mobile")}
            </JustForMobile>
            <Subheading>{t("reservationUnit:description")}</Subheading>
            <Content data-testid="reservation-unit__description">
              <Sanitize html={getTranslation(reservationUnit, "description")} />
            </Content>
            {reservationUnit.equipment?.length > 0 && (
              <>
                <Subheading>{t("reservationUnit:equipment")}</Subheading>
                <Content data-testid="reservation-unit__equipment">
                  <EquipmentList equipment={reservationUnit.equipment} />
                </Content>
              </>
            )}
            {isReservable && (
              <CalendarWrapper
                ref={calendarRef}
                data-testid="reservation-unit__calendar--wrapper"
              >
                <Subheading>
                  {t("reservations:reservationCalendar", {
                    title: getTranslation(reservationUnit, "name"),
                  })}
                </Subheading>
                {reservationUnit.maxReservationsPerUser &&
                  userReservations?.length > 0 && (
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
                        !isReservationQuotaReached
                      )
                    }
                    slotPropGetter={slotPropGetter}
                    viewType={calendarViewType}
                    onView={(n: WeekOptions) => {
                      setCalendarViewType(n);
                    }}
                    onSelecting={(
                      event: CalendarEvent<Reservation | ReservationType>
                    ) => handleEventChange(event, true)}
                    min={dayStartTime}
                    showToolbar
                    reservable={!isReservationQuotaReached}
                    toolbarComponent={Toolbar}
                    dateCellWrapperComponent={TouchCellWrapper}
                    eventWrapperComponent={EventWrapperComponent}
                    resizable={!isReservationQuotaReached}
                    draggable={
                      !isReservationQuotaReached && !isClientATouchDevice
                    }
                    onEventDrop={handleEventChange}
                    onEventResize={handleEventChange}
                    onSelectSlot={handleSlotClick}
                    draggableAccessor={({
                      event,
                    }: CalendarEvent<Reservation | ReservationType>) =>
                      (event.state as ReservationStateWithInitial) === "INITIAL"
                    }
                    resizableAccessor={({
                      event,
                    }: CalendarEvent<Reservation | ReservationType>) =>
                      (event.state as ReservationStateWithInitial) === "INITIAL"
                    }
                    step={30}
                    timeslots={getTimeslots(
                      reservationUnit.reservationStartInterval
                    )}
                    culture={i18n.language}
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
                        isSlotReservable={(startDate, endDate) =>
                          isSlotReservable(startDate, endDate)
                        }
                        isReserving={isReserving}
                        setCalendarFocusDate={setFocusDate}
                        activeApplicationRounds={activeApplicationRounds}
                        createReservation={(res) => createReservation(res)}
                        setErrorMsg={setErrorMsg}
                        handleEventChange={handleEventChange}
                        mode="create"
                        shouldCalendarControlsBeVisible={
                          shouldCalendarControlsBeVisible
                        }
                        setShouldCalendarControlsBeVisible={
                          setShouldCalendarControlsBeVisible
                        }
                        minTime={dayStartTime}
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
                        futurePricing.taxPercentage?.value > 0 && (
                          <strong>
                            {t("reservationUnit:futurePriceNoticeTax", {
                              tax: formatters.strippedDecimal.format(
                                futurePricing.taxPercentage.value
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
            {reservationUnit.unit?.location && (
              <Accordion heading={t("common:location")} theme="thin" open>
                <MapWrapper>
                  <Map
                    title={getTranslation(reservationUnit.unit, "name")}
                    latitude={Number(reservationUnit.unit.location.latitude)}
                    longitude={Number(reservationUnit.unit.location.longitude)}
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
                  <Sanitize html={cancellationTermsContent} />
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
          <div>
            <JustForDesktop customBreakpoint={breakpoints.l}>
              {quickReservationComponent(calendarRef, "desktop")}
            </JustForDesktop>
            <Address reservationUnit={reservationUnit} />
          </div>
        </TwoColumnLayout>
        <InfoDialog
          id="pricing-terms"
          heading={t("reservationUnit:pricingTerms")}
          text={getTranslation(reservationUnit.pricingTerms, "text")}
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
        >
          {errorMsg}
        </Toast>
      )}
    </Wrapper>
  ) : null;
};

export default ReservationUnit;
