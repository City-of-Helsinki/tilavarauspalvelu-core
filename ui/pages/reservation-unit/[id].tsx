import React, {
  Children,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GetServerSideProps } from "next";
import { Trans, useTranslation } from "next-i18next";
import styled from "styled-components";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { IconInfoCircleFill, Notification } from "hds-react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { addSeconds, addYears, parseISO } from "date-fns";
import {
  formatSecondDuration,
  toApiDate,
  toUIDate,
} from "common/src/common/util";
import {
  getEventBuffers,
  getMaxReservation,
  getNormalizedReservationBeginTime,
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
import { H4 } from "common/src/common/typography";
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
  formatDate,
  getTranslation,
  parseDate,
  printErrorMessages,
} from "../../modules/util";
import Toolbar, { ToolbarProps } from "../../components/calendar/Toolbar";
import {
  OPENING_HOURS,
  RELATED_RESERVATION_UNITS,
  RESERVATION_UNIT,
  TERMS_OF_USE,
} from "../../modules/queries/reservationUnit";
import { getApplicationRounds } from "../../modules/api";
import { DataContext, ReservationProps } from "../../context/DataContext";
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
import { daysByMonths } from "../../modules/const";
import QuickReservation from "../../components/reservation-unit/QuickReservation";
import { JustForDesktop, JustForMobile } from "../../modules/style/layout";
import { CURRENT_USER } from "../../modules/queries/user";
import { isReservationReservable } from "../../modules/reservation";
import SubventionSuffix from "../../components/reservation/SubventionSuffix";
import InfoDialog from "../../components/common/InfoDialog";

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
        termsType: "generic_terms",
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
        reservationUnit: {
          ...reservationUnitData?.reservationUnitByPk,
          openingHours: {
            openingTimes: allowReservationsWithoutOpeningHours
              ? mockOpeningTimes
              : additionalData.reservationUnitByPk?.openingHours
                  ?.openingTimes || [],
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

const Wrapper = styled.div`
  padding-bottom: var(--spacing-layout-xl);
`;

const TwoColumnLayout = styled.div`
  display: block;
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.l}) {
    display: grid;
    gap: var(--spacing-layout-s);
    grid-template-columns: 7fr 390px;
    margin-top: var(--spacing-m);
    margin-bottom: var(--spacing-xl);
  }
`;

const Left = styled.div`
  max-width: 100%;
`;

const Content = styled.div`
  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-l);
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: var(--spacing-2-xl);
`;

const PaddedContent = styled(Content)`
  padding-top: var(--spacing-m);
  margin-bottom: var(--spacing-m);
`;

const CalendarFooter = styled.div<{ $cookiehubBannerHeight?: number }>`
  position: sticky;
  bottom: ${({ $cookiehubBannerHeight }) =>
    $cookiehubBannerHeight ? `${$cookiehubBannerHeight}px` : 0};
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

const BottomWrapper = styled.div`
  margin: 0;
  padding: 0;
`;

const BottomContainer = styled(Container)`
  margin-bottom: calc(var(--spacing-s) * -1 + var(--spacing-layout-xl) * -1);
  padding-bottom: var(--spacing-layout-xl);
`;

const Subheading = styled(H4).attrs({ as: "h3" })<{ $withBorder?: boolean }>`
  ${({ $withBorder }) =>
    $withBorder &&
    `
      border-bottom: 1px solid var(--color-black-50);
      padding-bottom: var(--spacing-s);
    `}
`;

const CalendarWrapper = styled.div`
  margin-bottom: var(--spacing-layout-l);
  position: relative;
`;

const MapWrapper = styled.div`
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-xs);
`;

const StyledNotification = styled(Notification)`
  div > div {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
  margin-bottom: var(--spacing-xl);

  svg {
    color: var(--color-info);
    min-width: 24px;
  }

  button > svg {
    color: inherit;
  }
`;

const eventStyleGetter = (
  { event }: CalendarEvent<Reservation | ReservationType>,
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

  const { reservation, setReservation } = useContext(DataContext);

  const [userReservations, setUserReservations] = useState<
    ReservationType[] | null
  >(null);
  const [focusDate, setFocusDate] = useState(new Date());
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");
  const [initialReservation, setInitialReservation] =
    useState<PendingReservation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [storedReservation, , removeStoredReservation] =
    useLocalStorage<ReservationProps>("reservation");

  const calendarRef = useRef(null);
  const openPricingTermsRef = useRef(null);
  const hash = router.asPath.split("#")[1];

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

    if (storedReservation?.pk === reservationUnit.pk) {
      setFocusDate(new Date(storedReservation.begin));
      scrollToCalendar();
      setReservation(storedReservation);
      removeStoredReservation();
    } else if (hash === "calendar" && reservation) {
      scrollToCalendar();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation]);

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

  const handleEventChange = useCallback(
    (
      { start, end }: CalendarEvent<Reservation | ReservationType>,
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
      } else if (
        !isSlotReservable(start, end, skipLengthCheck) ||
        isReservationQuotaReached
      ) {
        return false;
      }

      setInitialReservation({
        begin: newReservation.begin,
        end: newReservation.end,
        state: "INITIAL",
      } as PendingReservation);
      return true;
    },
    [
      isReservationQuotaReached,
      isSlotReservable,
      reservationUnit.maxReservationDuration,
    ]
  );

  const handleSlotClick = useCallback(
    ({ start, action }, skipLengthCheck = false): boolean => {
      if (action !== "click" || isReservationQuotaReached) {
        return false;
      }

      const end = addSeconds(
        new Date(start),
        reservationUnit.minReservationDuration || 0
      );

      if (!isSlotReservable(start, end, skipLengthCheck)) {
        return false;
      }

      setInitialReservation({
        begin: start.toISOString(),
        end: end.toISOString(),
        state: "INITIAL",
      } as PendingReservation);
      return true;
    },
    [
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
    const start = reservation?.begin ? new Date(reservation.begin) : null;
    const end = reservation?.end ? new Date(reservation.end) : null;

    if (start && end) {
      handleEventChange(
        { start, end } as CalendarEvent<Reservation | ReservationType>,
        true
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation?.begin, reservation?.end]);

  const shouldDisplayBottomWrapper = useMemo(
    () => relatedReservationUnits?.length > 0,
    [relatedReservationUnits?.length]
  );

  const calendarEvents: CalendarEvent<Reservation | ReservationType>[] =
    useMemo(() => {
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
        bufferTimeBefore: reservationUnit.bufferTimeBefore?.toString(),
        bufferTimeAfter: reservationUnit.bufferTimeAfter?.toString(),
      } as PendingReservation,
    ]);
  }, [calendarEvents, initialReservation, reservationUnit]);

  const [
    addReservation,
    {
      data: createdReservation,
      loading: createReservationLoading,
      error: createReservationError,
    },
  ] = useMutation<
    { createReservation: ReservationCreateMutationPayload },
    { input: ReservationCreateMutationInput }
  >(CREATE_RESERVATION);

  useEffect(() => {
    if (!createReservationLoading) {
      if (createReservationError) {
        const msg = printErrorMessages(createReservationError);
        setErrorMsg(msg);
      } else if (createdReservation) {
        setPendingReservation({
          ...reservation,
          pk: createdReservation.createReservation.pk,
          price: createdReservation.createReservation.price,
        });

        router.push(`/reservation-unit/${reservationUnit.pk}/reservation`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    createdReservation,
    createReservationLoading,
    createReservationError,
    t,
    router,
    reservationUnit.pk,
    setReservation,
    setPendingReservation,
  ]);

  const createReservation = useCallback(
    (res: ReservationProps): void => {
      setErrorMsg(null);
      const { begin, end } = res;
      const input: ReservationCreateMutationInput = {
        begin,
        end,
        reservationUnitPks: [reservationUnit.pk],
      };

      setReservation({ begin, end, pk: reservationUnit.pk, price: null });

      addReservation({
        variables: {
          input,
        },
      });
    },
    [addReservation, reservationUnit.pk, setReservation]
  );

  const ToolbarWithProps = React.memo((props: ToolbarProps) => (
    <Toolbar {...props} />
  ));

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
    (calendar, type: "mobile" | "desktop") => {
      return (
        !isReservationStartInFuture(reservationUnit) &&
        isReservable && (
          <QuickReservation
            isSlotReservable={isSlotReservable}
            isReservationUnitReservable={!isReservationQuotaReached}
            createReservation={(res) => createReservation(res)}
            reservationUnit={reservationUnit}
            scrollPosition={calendar?.current?.offsetTop - 20}
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
            {isReservationStartInFuture(reservationUnit) && (
              <StyledNotification
                type="info"
                size="small"
                dismissible
                closeButtonLabelText={t("common:close")}
              >
                <IconInfoCircleFill aria-hidden />
                <span data-testid="reservation-unit--notification__reservation-start">
                  {t("reservationUnit:notifications.notReservable")}{" "}
                  {t("reservationCalendar:reservingStartsAt", {
                    date: t("common:dateTimeNoYear", {
                      date: parseISO(
                        getNormalizedReservationBeginTime(reservationUnit)
                      ),
                    }),
                  })}
                </span>
              </StyledNotification>
            )}
            {(isReservable ||
              (!isReservable &&
                isReservationStartInFuture(reservationUnit))) && (
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
                      type="alert"
                      label={t("common:fyiLabel")}
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
                    begin={focusDate || new Date()}
                    onNavigate={(d: Date) => {
                      setFocusDate(d);
                    }}
                    eventStyleGetter={(event) =>
                      eventStyleGetter(
                        event,
                        !isReservationQuotaReached,
                        userReservations?.map((n) => n.pk)
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
                    showToolbar
                    reservable={!isReservationQuotaReached}
                    toolbarComponent={
                      reservationUnit.nextAvailableSlot
                        ? ToolbarWithProps
                        : Toolbar
                    }
                    dateCellWrapperComponent={(props) => (
                      <TouchCellWrapper
                        {...props}
                        onSelectSlot={handleSlotClick}
                      />
                    )}
                    resizable={!isReservationQuotaReached}
                    draggable={!isReservationQuotaReached}
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
                  />
                </div>
                <Legend wrapBreakpoint={breakpoints.l} />
                {!isReservationQuotaReached &&
                  !isReservationStartInFuture(reservationUnit) && (
                    <CalendarFooter
                      $cookiehubBannerHeight={cookiehubBannerHeight}
                    >
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
                        createReservation={(res) => createReservation(res)}
                        setErrorMsg={setErrorMsg}
                        handleEventChange={handleEventChange}
                        mode="create"
                      />
                    </CalendarFooter>
                  )}
              </CalendarWrapper>
            )}
            {isReservable && (
              <>
                <Subheading $withBorder>
                  {t("reservationCalendar:reservationInfo")}
                </Subheading>
                <Content data-testid="reservation-unit__reservation-info">
                  {(reservationUnit.reservationsMaxDaysBefore ||
                    reservationUnit.reservationsMinDaysBefore) && (
                    <p>
                      {reservationUnit.reservationsMaxDaysBefore > 0 &&
                        reservationUnit.reservationsMinDaysBefore > 0 && (
                          <Trans i18nKey="reservationUnit:reservationInfo1-1">
                            Voit tehdä varauksen{" "}
                            <strong>
                              aikaisintaan{" "}
                              {{
                                reservationsMaxDaysBefore: daysByMonths.find(
                                  (n) =>
                                    n.value ===
                                    reservationUnit.reservationsMaxDaysBefore
                                )?.label,
                              }}
                              {{
                                unit: t(
                                  `reservationUnit:reservationInfo1-${
                                    reservationUnit.reservationsMaxDaysBefore ===
                                    14
                                      ? "weeks"
                                      : "months"
                                  }`
                                ),
                              }}
                            </strong>{" "}
                            ja{" "}
                            <strong>
                              viimeistään
                              {{
                                reservationsMinDaysBefore:
                                  reservationUnit.reservationsMinDaysBefore,
                              }}{" "}
                              päivää etukäteen
                            </strong>
                            .
                          </Trans>
                        )}
                      {reservationUnit.reservationsMaxDaysBefore > 0 &&
                        !reservationUnit.reservationsMinDaysBefore && (
                          <Trans i18nKey="reservationUnit:reservationInfo1-2">
                            Voit tehdä varauksen{" "}
                            <strong>
                              aikaisintaan{" "}
                              {{
                                reservationsMaxDaysBefore: daysByMonths.find(
                                  (n) =>
                                    n.value ===
                                    reservationUnit.reservationsMaxDaysBefore
                                )?.label,
                              }}{" "}
                              {{
                                unit: t(
                                  `reservationUnit:reservationInfo1-${
                                    reservationUnit.reservationsMaxDaysBefore ===
                                    14
                                      ? "weeks"
                                      : "months"
                                  }`
                                ),
                              }}{" "}
                              etukäteen
                            </strong>
                            .
                          </Trans>
                        )}
                      {reservationUnit.reservationsMaxDaysBefore === 0 &&
                        reservationUnit.reservationsMinDaysBefore > 0 && (
                          <Trans i18nKey="reservationUnit:reservationInfo1-3">
                            Voit tehdä varauksen{" "}
                            <strong>
                              viimeistään{" "}
                              {{
                                reservationsMinDaysBefore:
                                  reservationUnit.reservationsMinDaysBefore,
                              }}{" "}
                              päivää etukäteen
                            </strong>
                            .
                          </Trans>
                        )}
                    </p>
                  )}
                  {reservationUnit.reservationEnds && (
                    <p>
                      <Trans i18nKey="reservationUnit:reservationInfo2">
                        <strong>
                          Varauskalenteri on auki{" "}
                          {{
                            reservationEnds: formatDate(
                              reservationUnit.reservationEnds
                            ),
                          }}
                        </strong>{" "}
                        asti.
                      </Trans>
                    </p>
                  )}
                  {reservationUnit.minReservationDuration &&
                    reservationUnit.maxReservationDuration && (
                      <p>
                        <Trans i18nKey="reservationUnit:reservationInfo3">
                          Varauksen keston tulee olla välillä{" "}
                          <strong>
                            {{
                              minReservationDuration: formatSecondDuration(
                                reservationUnit.minReservationDuration,
                                false
                              ),
                            }}
                          </strong>{" "}
                          ja{" "}
                          <strong>
                            {{
                              maxReservationDuration: formatSecondDuration(
                                reservationUnit.maxReservationDuration,
                                false
                              ),
                            }}
                          </strong>
                          .
                        </Trans>
                      </p>
                    )}
                  {reservationUnit.maxReservationsPerUser && (
                    <p>
                      <Trans
                        i18nKey="reservationUnit:reservationInfo4"
                        count={reservationUnit.maxReservationsPerUser}
                      >
                        Sinulla voi olla samanaikaisesti{" "}
                        <strong>
                          enintään{" "}
                          {{ count: reservationUnit.maxReservationsPerUser }}{" "}
                          varausta
                        </strong>
                        .
                      </Trans>
                    </p>
                  )}
                </Content>
              </>
            )}
            {termsOfUseContent && (
              <Accordion
                heading={t("reservationUnit:terms")}
                theme="thin"
                data-testid="reservation-unit__reservation-notice"
              >
                <PaddedContent>
                  {futurePricing && (
                    <p style={{ marginTop: 0 }}>
                      <Trans i18nKey="reservationUnit:futurePricingNotice">
                        Huomioi{" "}
                        <strong>
                          hinnoittelumuutos{" "}
                          {{ date: toUIDate(new Date(futurePricing.begins)) }}{" "}
                          alkaen. Uusi hinta on{" "}
                          {{
                            price: getPrice({
                              pricing: futurePricing,
                              trailingZeros: true,
                            }).toLocaleLowerCase(),
                          }}
                        </strong>
                      </Trans>
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
          <>
            <BottomContainer>
              <Subheading>
                {t("reservationUnit:relatedReservationUnits")}
              </Subheading>
              <RelatedUnits units={relatedReservationUnits} />
            </BottomContainer>
          </>
        )}
      </BottomWrapper>
      {errorMsg && (
        <Notification
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
        </Notification>
      )}
    </Wrapper>
  ) : null;
};

export default ReservationUnit;
