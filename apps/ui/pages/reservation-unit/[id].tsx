import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { GetServerSidePropsContext } from "next";
import { Trans, useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import { addYears } from "date-fns";
import {
  fromUIDate,
  isValidDate,
  toApiDate,
  toUIDate,
} from "common/src/common/util";
import { formatters as getFormatters } from "common";
import { useLocalStorage } from "react-use";
import { breakpoints } from "common/src/common/style";
import { type PendingReservation } from "@/modules/types";
import {
  type ApplicationRoundTimeSlotNode,
  type ReservationCreateMutationInput,
  useCreateReservationMutation,
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
  isPriceFree,
  toNumber,
} from "common/src/helpers";
import Head from "@/components/reservation-unit/Head";
import { AddressSection } from "@/components/reservation-unit/Address";
import Sanitize from "@/components/common/Sanitize";
import {
  RelatedUnits,
  type RelatedNodeT,
} from "@/components/reservation-unit/RelatedUnits";
import { AccordionWithState as Accordion } from "@/components/Accordion";
import { createApolloClient } from "@/modules/apolloClient";
import { Map as MapComponent } from "@/components/Map";
import {
  getPostLoginUrl,
  getTranslation,
  printErrorMessages,
} from "@/modules/util";
import {
  getFuturePricing,
  getPossibleTimesForDay,
  getPriceString,
  getTimeString,
  isReservationUnitPublished,
  isReservationUnitReservable,
} from "@/modules/reservationUnit";
import EquipmentList from "@/components/reservation-unit/EquipmentList";
import { JustForDesktop, JustForMobile } from "@/modules/style/layout";
import {
  type FocusTimeSlot,
  convertFormToFocustimeSlot,
  createDateTime,
  getDurationOptions,
  isReservationStartInFuture,
} from "@/modules/reservation";
import {
  clampDuration,
  getMaxReservationDuration,
  getMinReservationDuration,
} from "@/modules/reservable";
import SubventionSuffix from "@/components/reservation/SubventionSuffix";
import InfoDialog from "@/components/common/InfoDialog";
import {
  BottomContainer,
  BottomWrapper,
  CalendarWrapper,
  Content,
  MapWrapper,
  PaddedContent,
  StyledNotification,
  Subheading,
  Wrapper,
} from "@/components/reservation-unit/ReservationUnitStyles";
import { QuickReservation } from "@/components/reservation-unit/QuickReservation";
import ReservationInfoContainer from "@/components/reservation-unit/ReservationInfoContainer";
import {
  getCommonServerSideProps,
  getGenericTerms,
} from "@/modules/serverUtils";
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
import { useReservableTimes } from "@/hooks/useReservableTimes";
import { errorToast } from "common/src/common/toast";
import { ReservationTimePicker } from "@/components/reservation/ReservationTimePicker";
import { ApolloError } from "@apollo/client";
import { getReservationInProgressPath } from "@/modules/urls";
import { ReservationPageWrapper } from "@/components/reservations/styles";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { params, query, locale } = ctx;
  const pk = Number(params?.id);
  const uuid = query.ru;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

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
    const activeApplicationRounds = filterNonNullable(
      reservationUnitData?.reservationUnit?.applicationRounds
    );

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

    const blockingReservations = filterNonNullable(
      reservationUnitData?.affectingReservations
    );

    return {
      props: {
        key: `${pk}-${locale}`,
        ...commonProps,
        ...(await serverSideTranslations(locale ?? "fi")),
        reservationUnit,
        reservableTimeSpans,
        blockingReservations,
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

function SubmitFragment(
  props: Readonly<{
    focusSlot: FocusTimeSlot;
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

const QuickReservationWrapper = styled.div`
  grid-column-end: -1;
`;

const PageContentWrapper = styled.div`
  grid-column: 1 / -2;

  @media (min-width: ${breakpoints.l}) {
    grid-row: 1;
  }
`;

function ReservationUnit({
  reservationUnit,
  relatedReservationUnits,
  activeApplicationRounds,
  blockingReservations,
  termsOfUse,
  isPostLogin,
  apiBaseUrl,
  searchDuration,
  searchDate,
  searchTime,
}: PropsNarrowed): JSX.Element | null {
  const { t } = useTranslation();
  const router = useRouter();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const durationOptions = getDurationOptions(reservationUnit, t);

  const minReservationDurationMinutes =
    getMinReservationDuration(reservationUnit);
  const maxReservationDurationMinutes =
    getMaxReservationDuration(reservationUnit);

  const searchUIDate = fromUIDate(searchDate ?? "");
  // TODO should be the first reservable day (the reservableTimeSpans logic is too complex and needs refactoring)
  // i.e. using a naive approach will return empty timespsans either reuse the logic for QuickReservation or refactor
  const defaultDate = new Date();
  const defaultDateString = toUIDate(defaultDate);
  const defaultValues = {
    date:
      searchUIDate != null && isValidDate(searchUIDate)
        ? (searchDate ?? "")
        : defaultDateString,
    duration: clampDuration(
      searchDuration ?? 0,
      minReservationDurationMinutes,
      maxReservationDurationMinutes,
      durationOptions
    ),
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
    return createDateTime(dateValue, timeValue);
  }, [dateValue, timeValue]);

  const submitReservation = async (data: PendingReservationFormType) => {
    if (reservationUnit.pk == null) {
      throw new Error("Reservation unit pk is missing");
    }
    const slot =
      convertFormToFocustimeSlot({
        data,
        reservationUnit,
        reservableTimes,
        activeApplicationRounds,
        blockingReservations,
      }) ?? {};
    if (!slot.isReservable) {
      throw new Error("Reservation slot is not reservable");
    }
    const { start: begin, end } = slot;
    const input: ReservationCreateMutationInput = {
      begin: begin.toISOString(),
      end: end.toISOString(),
      reservationUnitPks: [reservationUnit.pk],
    };
    await createReservation(input);
  };

  const reservableTimes = useReservableTimes(reservationUnit);

  // TODO the use of focusSlot is weird it double's up for both
  // calendar focus date and the reservation slot which causes issues
  // the calendar focus date should always be defined but the form values should not have valid default values
  // not having valid values will break other things so requires refactoring.
  const focusSlot: FocusTimeSlot | { isReservable: false } = useMemo(() => {
    const data = {
      date: dateValue,
      time: timeValue,
      duration: durationValue,
      isControlsVisible: true,
    };
    return convertFormToFocustimeSlot({
      data,
      reservationUnit,
      reservableTimes,
      activeApplicationRounds,
      blockingReservations,
    });
  }, [
    dateValue,
    durationValue,
    timeValue,
    reservationUnit,
    reservableTimes,
    activeApplicationRounds,
    blockingReservations,
  ]);

  const isReservationQuotaReached =
    reservationUnit.maxReservationsPerUser != null &&
    reservationUnit.numActiveUserReservations != null &&
    reservationUnit.numActiveUserReservations >=
      reservationUnit.maxReservationsPerUser;

  const showApplicationRoundTimeSlots = activeApplicationRounds.length > 0;

  const { applicationRoundTimeSlots } = reservationUnit;

  const shouldDisplayPricingTerms = useMemo(() => {
    const pricings = filterNonNullable(reservationUnit.pricings);
    if (pricings.length === 0) {
      return false;
    }
    const isPaid = pricings.some((pricing) => !isPriceFree(pricing));
    return reservationUnit.canApplyFreeOfCharge && isPaid;
  }, [reservationUnit.canApplyFreeOfCharge, reservationUnit.pricings]);

  const [addReservation] = useCreateReservationMutation();

  const createReservation = async (
    input: ReservationCreateMutationInput
  ): Promise<void> => {
    try {
      if (reservationUnit.pk == null) {
        throw new Error("Reservation unit pk is missing");
      }
      const res = await addReservation({
        variables: {
          input,
        },
      });
      const { pk } = res.data?.createReservation ?? {};
      if (pk == null) {
        throw new Error("Reservation creation failed");
      }
      if (reservationUnit.pk != null) {
        router.push(getReservationInProgressPath(reservationUnit.pk, pk));
      }
    } catch (error: unknown) {
      const msg =
        error instanceof ApolloError ? printErrorMessages(error) : null;
      errorToast({
        text: msg ?? t("errors:general_error"),
      });
    }
  };

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
    if (reservationUnit.pk == null) {
      return;
    }
    if (!focusSlot.isReservable) {
      return;
    }

    const { start, end } = focusSlot ?? {};
    // NOTE the only place where we use ISO strings since they are always converted to Date objects
    // another option would be to refactor storaged reservation to use Date objects
    setStoredReservation({
      begin: start.toISOString(),
      end: end.toISOString(),
      price: undefined,
      reservationUnitPk: reservationUnit.pk ?? 0,
    });
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
      createReservation(input);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* TODO why is this needed? do we need to reset the form values?
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
  */

  const shouldDisplayBottomWrapper = useMemo(
    () => relatedReservationUnits?.length > 0,
    [relatedReservationUnits?.length]
  );
  const termsOfUseContent = getTranslation(reservationUnit, "termsOfUse");
  const paymentTermsContent = reservationUnit.paymentTerms
    ? getTranslation(reservationUnit.paymentTerms, "text")
    : undefined;
  const cancellationTermsContent = reservationUnit.cancellationTerms
    ? getTranslation(reservationUnit.cancellationTerms, "text")
    : undefined;
  const pricingTermsContent = reservationUnit.pricingTerms
    ? getTranslation(reservationUnit.pricingTerms, "text")
    : undefined;
  const serviceSpecificTermsContent = reservationUnit.serviceSpecificTerms
    ? getTranslation(reservationUnit.serviceSpecificTerms, "text")
    : undefined;

  const equipment = filterNonNullable(reservationUnit.equipments);

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

  const startingTimeOptions = getPossibleTimesForDay({
    reservableTimes,
    interval: reservationUnit.reservationStartInterval,
    date: focusDate,
    reservationUnit,
    activeApplicationRounds,
    durationValue,
    blockingReservations,
  });
  const nextAvailableTime = getNextAvailableTime({
    start: focusDate,
    reservableTimes,
    duration: durationValue,
    reservationUnit,
    activeApplicationRounds,
    blockingReservations,
  });

  const isUnitReservable =
    !isReservationStartInFuture(reservationUnit) && reservationUnitIsReservable;

  return (
    <Wrapper>
      <Head
        reservationUnit={reservationUnit}
        reservationUnitIsReservable={reservationUnitIsReservable}
        subventionSuffix={
          reservationUnit.canApplyFreeOfCharge ? (
            <SubventionSuffix
              placement="reservation-unit-head"
              setIsDialogOpen={setIsDialogOpen}
            />
          ) : undefined
        }
      />
      <ReservationPageWrapper>
        <QuickReservationWrapper>
          {isUnitReservable && (
            <QuickReservation
              reservationUnit={reservationUnit}
              reservationForm={reservationForm}
              durationOptions={durationOptions}
              startingTimeOptions={startingTimeOptions}
              nextAvailableTime={nextAvailableTime}
              focusSlot={focusSlot}
              submitReservation={submitReservation}
              LoginAndSubmit={LoginAndSubmit}
              subventionSuffix={
                reservationUnit.canApplyFreeOfCharge ? (
                  <SubventionSuffix
                    placement="reservation-unit-head"
                    setIsDialogOpen={setIsDialogOpen}
                  />
                ) : undefined
              }
            />
          )}
          <JustForDesktop customBreakpoint={breakpoints.l}>
            <AddressSection reservationUnit={reservationUnit} />
          </JustForDesktop>
        </QuickReservationWrapper>
        <PageContentWrapper>
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
              <ReservationQuotaReached
                isReservationQuotaReached={isReservationQuotaReached}
                reservationUnit={reservationUnit}
              />
              <ReservationTimePicker
                reservationUnit={reservationUnit}
                reservableTimes={reservableTimes}
                activeApplicationRounds={activeApplicationRounds}
                reservationForm={reservationForm}
                isReservationQuotaReached={isReservationQuotaReached}
                loginAndSubmitButton={LoginAndSubmit}
                startingTimeOptions={startingTimeOptions}
                submitReservation={submitReservation}
                blockingReservations={blockingReservations}
              />
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
                <PriceChangeNotice
                  reservationUnit={reservationUnit}
                  activeApplicationRounds={activeApplicationRounds}
                />
                <Sanitize html={termsOfUseContent} />
              </PaddedContent>
            </Accordion>
          )}
          {showApplicationRoundTimeSlots && (
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
        </PageContentWrapper>
        <InfoDialog
          id="pricing-terms"
          heading={t("reservationUnit:pricingTerms")}
          text={pricingTermsContent ?? ""}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      </ReservationPageWrapper>
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
    </Wrapper>
  );
}

function ReservationQuotaReached({
  reservationUnit,
  isReservationQuotaReached,
}: {
  reservationUnit: NonNullable<ReservationUnitPageQuery["reservationUnit"]>;
  isReservationQuotaReached: boolean;
}) {
  const { t } = useTranslation();

  const isReached = reservationUnit.maxReservationsPerUser;
  if (!isReached || !reservationUnit.numActiveUserReservations) {
    return null;
  }

  return (
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
            count: reservationUnit.numActiveUserReservations ?? 0,
            total: reservationUnit.maxReservationsPerUser,
          }
        )}
      </span>
    </StyledNotification>
  );
}

function PriceChangeNotice({
  reservationUnit,
  activeApplicationRounds,
}: Pick<PropsNarrowed, "reservationUnit" | "activeApplicationRounds">) {
  const { t, i18n } = useTranslation();
  const futurePricing = getFuturePricing(
    reservationUnit,
    activeApplicationRounds
  );

  const formatters = getFormatters(i18n.language);

  if (!futurePricing) {
    return null;
  }

  const isPaid = !isPriceFree(futurePricing);
  const taxPercentage = toNumber(futurePricing.taxPercentage.value) ?? 0;
  const begins = new Date(futurePricing.begins);
  const priceString = getPriceString({
    t,
    pricing: futurePricing,
  }).toLocaleLowerCase();
  const showTaxNotice = isPaid && taxPercentage > 0;

  return (
    <p style={{ marginTop: 0 }}>
      <Trans
        i18nKey="reservationUnit:futurePricingNotice"
        defaults="Huomioi <bold>hinnoittelumuutos {{date}} alkaen. Uusi hinta on {{price}}</bold>."
        values={{
          date: toUIDate(begins),
          price: priceString,
        }}
        components={{ bold: <strong /> }}
      />
      {showTaxNotice && (
        <strong>
          {t("reservationUnit:futurePriceNoticeTax", {
            tax: formatters.strippedDecimal.format(taxPercentage),
          })}
        </strong>
      )}
      .
    </p>
  );
}

export default ReservationUnit;
