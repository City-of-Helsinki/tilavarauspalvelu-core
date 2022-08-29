import React, { useContext, useMemo, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import { Trans, useTranslation } from "next-i18next";
import styled from "styled-components";
import { useQuery } from "@apollo/client";
import { Notification } from "hds-react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  addDays,
  addSeconds,
  addYears,
  isValid,
  parseISO,
  subMinutes,
} from "date-fns";
import Container from "../../components/common/Container";
import { ApplicationRound, PendingReservation } from "../../modules/types";
import Head from "../../components/reservation-unit/Head";
import Address from "../../components/reservation-unit/Address";
import Sanitize from "../../components/common/Sanitize";
import { breakpoint } from "../../modules/style";
import RelatedUnits from "../../components/reservation-unit/RelatedUnits";
import { AccordionWithState as Accordion } from "../../components/common/Accordion";
import apolloClient from "../../modules/apolloClient";
import Map from "../../components/Map";
import { H4 } from "../../modules/style/typography";
import Calendar, { CalendarEvent } from "../../components/calendar/Calendar";
import Legend from "../../components/calendar/Legend";
import LoginFragment from "../../components/LoginFragment";
import ReservationInfo from "../../components/calendar/ReservationInfo";
import {
  formatDate,
  formatSecondDuration,
  getTranslation,
  parseDate,
  toApiDate,
} from "../../modules/util";
import {
  areSlotsReservable,
  doBuffersCollide,
  doReservationsCollide,
  getEventBuffers,
  getNormalizedReservationBeginTime,
  getSlotPropGetter,
  getTimeslots,
  isReservationLongEnough,
  isReservationShortEnough,
  isReservationStartInFuture,
  isReservationUnitReservable,
  isStartTimeWithinInterval,
} from "../../modules/calendar";
import Toolbar, { ToolbarProps } from "../../components/calendar/Toolbar";
import {
  Query,
  QueryReservationsArgs,
  QueryReservationUnitByPkArgs,
  QueryReservationUnitsArgs,
  QueryTermsOfUseArgs,
  ReservationsReservationStateChoices,
  ReservationType,
  ReservationUnitByPkType,
  ReservationUnitByPkTypeOpeningHoursArgs,
  ReservationUnitByPkTypeReservationsArgs,
  ReservationUnitType,
  ReservationUnitTypeEdge,
  TermsOfUseType,
} from "../../modules/gql-types";
import {
  OPENING_HOURS,
  RELATED_RESERVATION_UNITS,
  RESERVATION_UNIT,
  TERMS_OF_USE,
} from "../../modules/queries/reservationUnit";
import { getApplicationRounds } from "../../modules/api";
import { DataContext } from "../../context/DataContext";
import { LIST_RESERVATIONS } from "../../modules/queries/reservation";
import { isReservationUnitPublished } from "../../modules/reservationUnit";
import EquipmentList from "../../components/reservation-unit/EquipmentList";
import { daysByMonths } from "../../modules/const";

type Props = {
  reservationUnit: ReservationUnitByPkType | null;
  relatedReservationUnits: ReservationUnitType[];
  activeApplicationRounds: ApplicationRound[];
  termsOfUse: Record<string, TermsOfUseType>;
};

type WeekOptions = "day" | "week" | "month";

type ReservationStateWithInitial = string;

const openingTimePeriods = [
  {
    periodId: 38600,
    startDate: toApiDate(new Date()),
    endDate: toApiDate(addDays(new Date(), 30)),
    resourceState: null,
    timeSpans: [
      {
        startTime: "09:00:00+00:00",
        endTime: "12:00:00+00:00",
        weekdays: [6, 1, 7],
        resourceState: "open",
        endTimeOnNextDay: null,
        nameFi: "Span name Fi",
        nameEn: "Span name En",
        nameSv: "Span name Sv",
        descriptionFi: "Span desc Fi",
        descriptionEn: "Span desc En",
        descriptionSv: "Span desc Sv",
      },
      {
        startTime: "12:00:00+00:00",
        endTime: "21:00:00+00:00",
        weekdays: [7, 2],
        resourceState: "open",
        endTimeOnNextDay: null,
        nameFi: "Span name Fi",
        nameEn: "Span name En",
        nameSv: "Span name Sv",
        descriptionFi: "Span desc Fi",
        descriptionEn: "Span desc En",
        descriptionSv: "Span desc Sv",
      },
    ],
    nameFi: "Period name Fi",
    nameEn: "Period name En",
    nameSv: "Period name Sv",
    descriptionFi: "Period desc Fi",
    descriptionEn: "Period desc En",
    descriptionSv: "Period desc Sv",
  },
  {
    periodId: 38601,
    startDate: toApiDate(addDays(new Date(), 30)),
    endDate: toApiDate(addDays(new Date(), 300)),
    resourceState: null,
    timeSpans: [
      {
        startTime: "09:00:00+00:00",
        endTime: "21:00:00+00:00",
        weekdays: [4, 5, 6],
        resourceState: "open",
        endTimeOnNextDay: null,
        nameFi: "Span name Fi",
        nameEn: "Span name En",
        nameSv: "Span name Sv",
        descriptionFi: "Span desc Fi",
        descriptionEn: "Span desc En",
        descriptionSv: "Span desc Sv",
      },
      {
        startTime: "09:00:00+00:00",
        endTime: "21:00:00+00:00",
        weekdays: [7],
        resourceState: "open",
        endTimeOnNextDay: null,
        nameFi: "Span name Fi",
        nameEn: "Span name En",
        nameSv: "Span name Sv",
        descriptionFi: "Span desc Fi",
        descriptionEn: "Span desc En",
        descriptionSv: "Span desc Sv",
      },
    ],
    nameFi: "Period name Fi",
    nameEn: "Period name En",
    nameSv: "Period name Sv",
    descriptionFi: "Period desc Fi",
    descriptionEn: "Period desc En",
    descriptionSv: "Period desc Sv",
  },
];

const openingTimes = Array.from(Array(100)).map((val, index) => ({
  date: toApiDate(addDays(new Date(), index)),
  startTime: "04:00:00+00:00",
  endTime: "20:00:00+00:00",
  state: "open",
  periods: null,
}));

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
        // startDate: today,
        // endDate: lastOpeningPeriodEndDate,
        from: today,
        to: lastOpeningPeriodEndDate,
        state: ["CREATED", "CONFIRMED"],
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
              ? openingTimes
              : [],
            openingTimePeriods: allowReservationsWithoutOpeningHours
              ? openingTimePeriods
              : [],
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

  @media (min-width: ${breakpoint.l}) {
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
  /* & > p {
    margin: 0;
  } */

  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-l);
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: var(--spacing-2-xl);
`;

const PaddedContent = styled(Content)`
  padding-top: var(--spacing-m);
`;

const CalendarFooter = styled.div`
  display: flex;
  flex-direction: column-reverse;

  button {
    order: 2;
  }

  @media (min-width: ${breakpoint.l}) {
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
  margin-bottom: var(--spacing-xl);
`;

const MapWrapper = styled.div`
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-xs);
`;

const StyledNotification = styled(Notification)`
  margin-bottom: var(--spacing-xl);

  svg {
    position: relative;
    top: -3px;
  }
`;

const eventStyleGetter = (
  { event }: CalendarEvent,
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

  const state = event?.state as ReservationStateWithInitial;

  switch (state) {
    case "INITIAL":
      style.backgroundColor = "var(--color-success-dark)";
      className = draggable ? "rbc-event-movable" : "";
      break;
    case "BUFFER":
      style.backgroundColor = "var(--color-black-10)";
      className = "rbc-event-buffer";
      break;
    default:
      style.backgroundColor = "var(--color-brick-dark)";
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
  const { t } = useTranslation();
  const now = useMemo(() => new Date().toISOString(), []);

  const { reservation } = useContext(DataContext);

  const [userReservations, setUserReservations] = useState<ReservationType[]>(
    []
  );
  const [focusDate, setFocusDate] = useState(new Date());
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");
  const [initialReservation, setInitialReservation] =
    useState<PendingReservation | null>(null);

  useQuery<Query, QueryReservationsArgs>(LIST_RESERVATIONS, {
    fetchPolicy: "no-cache",
    variables: {
      begin: now,
    },
    onCompleted: (res) => {
      const allowedReservationStates = [
        ReservationsReservationStateChoices.Created,
        ReservationsReservationStateChoices.Confirmed,
        ReservationsReservationStateChoices.RequiresHandling,
      ];
      const reservations = res?.reservations?.edges
        ?.map(({ node }) => node)
        .filter((n) => allowedReservationStates.includes(n.state));
      setUserReservations(reservations);
    },
  });

  // const activeOpeningTimes = getActiveOpeningTimes(
  //   reservationUnit.openingHours?.openingTimePeriods
  // );

  const slotPropGetter = useMemo(
    () =>
      getSlotPropGetter(
        reservationUnit.openingHours?.openingTimes,
        activeApplicationRounds,
        reservationUnit.reservationBegins,
        reservationUnit.reservationEnds,
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
  }, [reservationUnit, userReservations]);

  const isSlotReservable = (
    start: Date,
    end: Date,
    skipLengthCheck = false
  ): boolean => {
    const {
      reservations,
      bufferTimeBefore,
      bufferTimeAfter,
      openingHours,
      maxReservationDuration,
      minReservationDuration,
      reservationStartInterval,
      reservationsMinDaysBefore,
      reservationBegins,
      reservationEnds,
    } = reservationUnit;

    if (
      !isValid(start) ||
      !isValid(end) ||
      doBuffersCollide(reservations, {
        start,
        end,
        bufferTimeBefore,
        bufferTimeAfter,
      }) ||
      !isStartTimeWithinInterval(
        start,
        openingHours?.openingTimes,
        reservationStartInterval
      ) ||
      !areSlotsReservable(
        [new Date(start), subMinutes(new Date(end), 1)],
        openingHours?.openingTimes,
        activeApplicationRounds,
        reservationBegins,
        reservationEnds,
        reservationsMinDaysBefore
      ) ||
      (!skipLengthCheck &&
        !isReservationLongEnough(start, end, minReservationDuration)) ||
      !isReservationShortEnough(start, end, maxReservationDuration) ||
      doReservationsCollide(reservations, { start, end })
      // || !isSlotWithinTimeframe(start, reservationsMinDaysBefore, start, end)
    ) {
      return false;
    }

    return true;
  };

  const handleEventChange = (
    { start, end }: CalendarEvent,
    skipLengthCheck = false
  ): boolean => {
    if (
      !isSlotReservable(start, end, skipLengthCheck) ||
      isReservationQuotaReached
    ) {
      return false;
    }

    setInitialReservation({
      begin: start.toISOString(),
      end: end.toISOString(),
      state: "INITIAL",
    } as PendingReservation);
    return true;
  };

  const handleSlotClick = (
    { start, action },
    skipLengthCheck = false
  ): boolean => {
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
  };

  useMemo(() => {
    handleEventChange({
      start: reservation?.begin && new Date(reservation?.begin),
      end: reservation?.end && new Date(reservation?.end),
    } as CalendarEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation]);

  const calendarRef = useRef(null);

  const shouldDisplayBottomWrapper = relatedReservationUnits?.length > 0;

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return reservationUnit?.reservations
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
  }, [reservationUnit, t, initialReservation]);

  const eventBuffers = useMemo(() => {
    return getEventBuffers([
      ...(calendarEvents.flatMap((e) => e.event) as ReservationType[]),
      {
        begin: initialReservation?.begin,
        end: initialReservation?.end,
        state: "INITIAL",
        bufferTimeBefore: reservationUnit.bufferTimeBefore,
        bufferTimeAfter: reservationUnit.bufferTimeAfter,
      } as PendingReservation,
    ]);
  }, [calendarEvents, initialReservation, reservationUnit]);

  const ToolbarWithProps = React.memo((props: ToolbarProps) => (
    <Toolbar {...props} />
  ));

  const isReservable = useMemo(() => {
    return (
      // reservationUnit.openingHours?.openingTimes?.length > 0 &&
      reservationUnit.minReservationDuration &&
      reservationUnit.maxReservationDuration &&
      isReservationUnitReservable(reservationUnit)
    );
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

  const serviceSpecificTermsContent = useMemo(
    () => getTranslation(reservationUnit.serviceSpecificTerms, "text"),
    [reservationUnit]
  );

  return reservationUnit ? (
    <Wrapper>
      <Head
        reservationUnit={reservationUnit}
        // activeOpeningTimes={activeOpeningTimes}
        isReservable={isReservable}
      />
      <Container>
        <TwoColumnLayout>
          <Left>
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
              <StyledNotification type="info" label={t("common:fyiLabel")}>
                <span data-testid="reservation-unit--notification__reservation-start">
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
                  <Calendar
                    events={[...calendarEvents, ...eventBuffers]}
                    begin={focusDate || new Date()}
                    onNavigate={(d: Date) => {
                      setFocusDate(d);
                    }}
                    customEventStyleGetter={(event) =>
                      eventStyleGetter(event, !isReservationQuotaReached)
                    }
                    slotPropGetter={slotPropGetter}
                    viewType={calendarViewType}
                    onView={(n: WeekOptions) => {
                      setCalendarViewType(n);
                    }}
                    onSelecting={(event: CalendarEvent) =>
                      handleEventChange(event, true)
                    }
                    showToolbar
                    reservable={!isReservationQuotaReached}
                    toolbarComponent={
                      reservationUnit.nextAvailableSlot
                        ? ToolbarWithProps
                        : Toolbar
                    }
                    resizable={!isReservationQuotaReached}
                    draggable={!isReservationQuotaReached}
                    onEventDrop={handleEventChange}
                    onEventResize={handleEventChange}
                    onSelectSlot={handleSlotClick}
                    draggableAccessor={({ event }: CalendarEvent) =>
                      (event.state as ReservationStateWithInitial) === "INITIAL"
                    }
                    resizableAccessor={({ event }: CalendarEvent) =>
                      (event.state as ReservationStateWithInitial) === "INITIAL"
                    }
                    step={15}
                    timeslots={getTimeslots(
                      reservationUnit.reservationStartInterval
                    )}
                    aria-hidden
                  />
                </div>
                <CalendarFooter>
                  <LoginFragment
                    text={t("reservationCalendar:loginInfo")}
                    componentIfAuthenticated={
                      !isReservationQuotaReached && (
                        <ReservationInfo
                          reservationUnit={reservationUnit}
                          begin={initialReservation?.begin}
                          end={initialReservation?.end}
                          resetReservation={() => setInitialReservation(null)}
                          isSlotReservable={isSlotReservable}
                          setCalendarFocusDate={setFocusDate}
                          activeApplicationRounds={activeApplicationRounds}
                        />
                      )
                    }
                  />
                  <Legend />
                </CalendarFooter>
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
              <Accordion heading={t("reservationUnit:terms")} theme="thin">
                <PaddedContent>
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
                {paymentTermsContent && (
                  <PaddedContent>
                    <Sanitize html={paymentTermsContent} />
                  </PaddedContent>
                )}
                <PaddedContent>
                  <Sanitize html={cancellationTermsContent} />
                </PaddedContent>
              </Accordion>
            )}
            <Accordion
              heading={t("reservationUnit:termsOfUse")}
              theme="thin"
              data-testid="reservation-unit__terms-of-use"
            >
              {serviceSpecificTermsContent && (
                <PaddedContent>
                  <Sanitize html={serviceSpecificTermsContent} />
                </PaddedContent>
              )}
              <PaddedContent>
                <Sanitize
                  html={getTranslation(termsOfUse.genericTerms, "text")}
                />
              </PaddedContent>
            </Accordion>
          </Left>
          <div>
            <Address reservationUnit={reservationUnit} />
          </div>
        </TwoColumnLayout>
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
    </Wrapper>
  ) : null;
};

export default ReservationUnit;
