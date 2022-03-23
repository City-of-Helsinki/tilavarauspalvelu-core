import React, { useContext, useMemo, useRef, useState } from "react";
import { GetServerSideProps } from "next";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { useQuery } from "@apollo/client";
import { Koros, Notification } from "hds-react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { addSeconds, addYears, isValid, parseISO, subMinutes } from "date-fns";
import Container from "../../../components/common/Container";
import { ApplicationRound, PendingReservation } from "../../../modules/types";
import Head from "../../../components/reservation-unit/Head";
import Address from "../../../components/reservation-unit/Address";
import Sanitize from "../../../components/common/Sanitize";
import { breakpoint } from "../../../modules/style";
import RelatedUnits from "../../../components/reservation-unit/RelatedUnits";
import useReservationUnitsList from "../../../hooks/useReservationUnitList";
import { AccordionWithState as Accordion } from "../../../components/common/Accordion";
import apolloClient from "../../../modules/apolloClient";
import Map from "../../../components/Map";
import { H2 } from "../../../modules/style/typography";
import Calendar, { CalendarEvent } from "../../../components/calendar/Calendar";
import Legend from "../../../components/calendar/Legend";
import LoginFragment from "../../../components/LoginFragment";
import ReservationInfo from "../../../components/calendar/ReservationInfo";
import { getTranslation, parseDate, toApiDate } from "../../../modules/util";
import {
  areSlotsReservable,
  doBuffersCollide,
  doReservationsCollide,
  getEventBuffers,
  getSlotPropGetter,
  getTimeslots,
  isReservationLongEnough,
  isReservationShortEnough,
  isReservationStartInFuture,
  isReservationUnitReservable,
  isSlotWithinTimeframe,
  isStartTimeWithinInterval,
} from "../../../modules/calendar";
import Toolbar, { ToolbarProps } from "../../../components/calendar/Toolbar";
import { getActiveOpeningTimes } from "../../../modules/openingHours";
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
} from "../../../modules/gql-types";
import {
  OPENING_HOURS,
  RELATED_RESERVATION_UNITS,
  RESERVATION_UNIT,
  TERMS_OF_USE,
} from "../../../modules/queries/reservationUnit";
import { getApplicationRounds } from "../../../modules/api";
import { DataContext } from "../../../context/DataContext";
import { LIST_RESERVATIONS } from "../../../modules/queries/reservation";
import {
  getEquipmentList,
  isReservationUnitPublished,
} from "../../../modules/reservationUnit";

type Props = {
  reservationUnit: ReservationUnitByPkType | null;
  relatedReservationUnits: ReservationUnitType[];
  activeApplicationRounds: ApplicationRound[];
  termsOfUse: Record<string, TermsOfUseType>;
};

type WeekOptions = "day" | "week" | "month";

type ReservationStateWithInitial = string;

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
      variables: {
        pk: id,
      },
    });

    const previewPass = uuid === reservationUnitData.reservationUnitByPk.uuid;

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
      variables: {
        pk: id,
        startDate: today,
        endDate: lastOpeningPeriodEndDate,
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

    return {
      props: {
        ...(await serverSideTranslations(locale)),
        overrideBackgroundColor: "var(--tilavaraus-gray)",
        reservationUnit: {
          ...reservationUnitData?.reservationUnitByPk,
          openingHours: {
            ...reservationUnitData?.reservationUnitByPk?.openingHours,
            openingTimes:
              additionalData?.reservationUnitByPk?.openingHours?.openingTimes ||
              null,
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

  return { props: { ...(await serverSideTranslations(locale)), paramsId: id } };
};

const Wrapper = styled.div`
  padding-bottom: var(--spacing-layout-xl);
`;

const TwoColumnLayout = styled.div`
  display: grid;
  gap: var(--spacing-layout-s);
  grid-template-columns: 7fr 390px;
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-xl);

  @media (max-width: ${breakpoint.l}) {
    grid-template-columns: 1fr;
    margin-bottom: var(--spacing-m);
  }
`;

const Content = styled.div`
  & p {
    font-size: var(--fontsize-body-l);
    line-height: var(--lineheight-xl);
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

const CalendarFooter = styled.div`
  display: flex;
  flex-direction: column-reverse;

  button {
    order: 2;
  }

  @media (min-width: ${breakpoint.l}) {
    flex-direction: row;
    gap: var(--spacing-2-xl);
    justify-content: space-between;
  }
`;

const BottomWrapper = styled.div`
  margin: 0;
  padding: 0;
  background-color: var(--color-silver-medium-light);
`;

const BottomContainer = styled(Container)`
  background-color: var(--color-silver-medium-light);
  margin-top: var(--spacing-layout-l);
  margin-bottom: calc(var(--spacing-s) * -1 + var(--spacing-layout-xl) * -1);
  padding-bottom: var(--spacing-layout-xl);
`;

const StyledKoros = styled(Koros).attrs({
  type: "basic",
})`
  fill: var(--tilavaraus-gray);
`;

const StyledH2 = styled(H2)``;

const CalendarWrapper = styled.div`
  margin-bottom: var(--spacing-layout-xl);
`;

const EquipmentList = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-2-xs) var(--spacing-m);
  padding: 0;

  @media (min-width: ${breakpoint.s}) {
    grid-template-columns: 1fr 1fr;
    row-gap: var(--spacing-s);
  }

  @media (min-width: ${breakpoint.m}) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const EquipmentItem = styled.li`
  font-size: var(--fontsize-body-m);

  @media (min-width: ${breakpoint.s}) {
    font-size: var(--fontsize-body-l);
  }
`;

const MapWrapper = styled.div`
  margin-bottom: var(--spacing-xl);
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

  const activeOpeningTimes = getActiveOpeningTimes(
    reservationUnit.openingHours?.openingTimePeriods
  );

  const slotPropGetter = useMemo(
    () =>
      getSlotPropGetter(
        reservationUnit.openingHours?.openingTimes,
        activeApplicationRounds
      ),
    [reservationUnit.openingHours?.openingTimes, activeApplicationRounds]
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
    if (
      !isValid(start) ||
      !isValid(end) ||
      doBuffersCollide(reservationUnit.reservations, {
        start,
        end,
        bufferTimeBefore: reservationUnit.bufferTimeBefore,
        bufferTimeAfter: reservationUnit.bufferTimeAfter,
      }) ||
      !isStartTimeWithinInterval(
        start,
        reservationUnit.openingHours?.openingTimes,
        reservationUnit.reservationStartInterval
      ) ||
      !areSlotsReservable(
        [new Date(start), subMinutes(new Date(end), 1)],
        reservationUnit.openingHours?.openingTimes,
        activeApplicationRounds
      ) ||
      (!skipLengthCheck &&
        !isReservationLongEnough(
          start,
          end,
          reservationUnit.minReservationDuration
        )) ||
      !isReservationShortEnough(
        start,
        end,
        reservationUnit.maxReservationDuration
      ) ||
      doReservationsCollide(reservationUnit.reservations, { start, end }) ||
      !isSlotWithinTimeframe(start)
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

  const reservationUnitList = useReservationUnitsList();

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
    <Toolbar
      {...props}
      onNavigateToNextAvailableDate={() =>
        reservationUnit.nextAvailableSlot &&
        setFocusDate(new Date(reservationUnit.nextAvailableSlot))
      }
    />
  ));

  const isReservable = useMemo(() => {
    return (
      reservationUnit.openingHours?.openingTimes?.length > 0 &&
      reservationUnit.minReservationDuration &&
      reservationUnit.maxReservationDuration &&
      isReservationUnitReservable(reservationUnit)
    );
  }, [reservationUnit]);

  const equipmentList = useMemo(() => {
    return getEquipmentList(reservationUnit.equipment);
  }, [reservationUnit.equipment]);

  return reservationUnit ? (
    <Wrapper>
      <Head
        reservationUnit={reservationUnit}
        activeOpeningTimes={activeOpeningTimes}
        reservationUnitList={reservationUnitList}
        viewType="single"
        calendarRef={calendarRef}
        isReservable={isReservable}
      />
      <Container>
        <TwoColumnLayout>
          <div>
            <Accordion
              open
              heading={t("reservationUnit:description")}
              theme="thin"
              data-testid="reservation-unit__accordion--description"
            >
              <Content>
                <p>
                  <Sanitize
                    html={getTranslation(reservationUnit, "description")}
                  />
                </p>
              </Content>
            </Accordion>
            {equipmentList?.length > 0 && (
              <Accordion
                open
                heading={t("reservationUnit:equipment")}
                theme="thin"
                data-testid="reservation-unit__accordion--equipment"
              >
                <Content>
                  <EquipmentList>
                    {equipmentList.map((equipment) => (
                      <EquipmentItem key={equipment}>{equipment}</EquipmentItem>
                    ))}
                  </EquipmentList>
                </Content>
              </Accordion>
            )}
          </div>
          <div>
            <Address reservationUnit={reservationUnit} />
          </div>
        </TwoColumnLayout>
        {isReservable && (
          <CalendarWrapper
            ref={calendarRef}
            data-testid="reservation-unit__calendar--wrapper"
          >
            <StyledH2>{t("reservations:reservationCalendar")}</StyledH2>
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
                  reservationUnit.nextAvailableSlot ? ToolbarWithProps : Toolbar
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
        {isReservationStartInFuture(reservationUnit) && (
          <StyledNotification type="info" label={t("common:fyiLabel")}>
            <span data-testid="reservation-unit--notification__reservation-start">
              {t("reservationCalendar:reservingStartsAt", {
                date: t("common:dateTimeNoYear", {
                  date: parseISO(reservationUnit.reservationBegins),
                }),
              })}
            </span>
          </StyledNotification>
        )}
        {reservationUnit.maxReservationsPerUser &&
          userReservations?.length > 0 && (
            <StyledNotification type="alert" label={t("common:fyiLabel")}>
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
        {reservationUnit.unit?.location && (
          <MapWrapper>
            <StyledH2>{t("common:location")}</StyledH2>
            <Map
              title={getTranslation(reservationUnit.unit, "name")}
              latitude={Number(reservationUnit.unit.location.latitude)}
              longitude={Number(reservationUnit.unit.location.longitude)}
            />
          </MapWrapper>
        )}
        <TwoColumnLayout>
          <Address reservationUnit={reservationUnit} />
          <div />
          <Accordion heading={t("reservationUnit:termsOfUse")} theme="thin">
            <Content>
              <p>
                <Sanitize
                  html={getTranslation(termsOfUse.genericTerms, "text")}
                />
              </p>
            </Content>
          </Accordion>
          <div />
          {getTranslation(reservationUnit, "termsOfUse") &&
            reservationUnit.serviceSpecificTerms && (
              <>
                <Accordion
                  heading={t("reservationUnit:termsOfUseSpaces")}
                  theme="thin"
                >
                  <Content>
                    <p>
                      <Sanitize
                        html={getTranslation(reservationUnit, "termsOfUse")}
                      />
                    </p>
                    <p>
                      <Sanitize
                        html={getTranslation(
                          reservationUnit.serviceSpecificTerms,
                          "text"
                        )}
                      />
                    </p>
                  </Content>
                </Accordion>
                <div />
              </>
            )}
        </TwoColumnLayout>
      </Container>
      <BottomWrapper>
        {shouldDisplayBottomWrapper && (
          <>
            <StyledKoros flipHorizontal />
            <BottomContainer>
              <RelatedUnits
                reservationUnitList={reservationUnitList}
                units={relatedReservationUnits}
                viewType="single"
              />
            </BottomContainer>
          </>
        )}
      </BottomWrapper>
    </Wrapper>
  ) : null;
};

export default ReservationUnit;
