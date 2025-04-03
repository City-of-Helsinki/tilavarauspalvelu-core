import React, { useMemo, useState } from "react";
import type { GetServerSidePropsContext } from "next";
import { Trans, useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import { addYears } from "date-fns";
import {
  convertLanguageCode,
  fromUIDate,
  getTranslationSafe,
  isValidDate,
  toApiDate,
  toUIDate,
} from "common/src/common/util";
import { formatters as getFormatters, H4 } from "common";
import { breakpoints } from "common/src/common/style";
import {
  type ApplicationRoundTimeSlotFieldsFragment,
  type ReservationCreateMutationInput,
  useCreateReservationMutation,
  type ReservationUnitPageQuery,
  type ReservationUnitPageQueryVariables,
  ReservationUnitPageDocument,
  RelatedReservationUnitsDocument,
  type RelatedReservationUnitsQuery,
  type RelatedReservationUnitsQueryVariables,
  CreateReservationDocument,
  type CreateReservationMutation,
  type CreateReservationMutationVariables,
  CurrentUserDocument,
  type CurrentUserQuery,
  type TimeSlotType,
  type RelatedUnitCardFieldsFragment,
} from "@gql/gql-types";
import {
  base64encode,
  filterNonNullable,
  formatTimeRange,
  fromMondayFirstUnsafe,
  ignoreMaybeArray,
  isPriceFree,
  timeToMinutes,
  toNumber,
} from "common/src/helpers";
import { Sanitize } from "common/src/components/Sanitize";
import { AccordionWithState as Accordion } from "@/components/Accordion";
import { createApolloClient } from "@/modules/apolloClient";
import { Map as MapComponent } from "@/components/Map";
import { getPostLoginUrl } from "@/modules/util";
import {
  getFuturePricing,
  getPossibleTimesForDay,
  getPriceString,
  getReservationUnitName,
  getTimeString,
  isReservationUnitPublished,
  isReservationUnitReservable,
} from "@/modules/reservationUnit";
import { JustForDesktop, JustForMobile } from "@/modules/style/layout";
import {
  type FocusTimeSlot,
  convertFormToFocustimeSlot,
  createDateTime,
  getDurationOptions,
} from "@/modules/reservation";
import {
  clampDuration,
  getMaxReservationDuration,
  getMinReservationDuration,
} from "@/modules/reservable";
import {
  SubventionSuffix,
  ReservationTimePicker,
} from "@/components/reservation";
import InfoDialog from "@/components/common/InfoDialog";
import {
  AddressSection,
  Head,
  RelatedUnits,
  EquipmentList,
  QuickReservation,
  ReservationInfoContainer,
} from "@/components/reservation-unit";
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
import { LoginFragment } from "@/components/LoginFragment";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { useReservableTimes } from "@/hooks/useReservableTimes";
import { SubmitButton } from "@/styled/util";
import { ReservationUnitPageWrapper } from "@/styled/reservation";
import {
  getReservationInProgressPath,
  getSingleSearchPath,
} from "@/modules/urls";
import { ButtonVariant, LoadingSpinner, Notification } from "hds-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Flex } from "common/styles/util";
import { useDisplayError } from "@/hooks/useDisplayError";
import { useRemoveStoredReservation } from "@/hooks/useRemoveStoredReservation";
import { gql } from "@apollo/client";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { params, query, locale } = ctx;
  const pk = toNumber(ignoreMaybeArray(params?.id));
  const uuid = query.ru;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const notFound = {
    props: {
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
      notFound: true, // required for type narrowing
    },
    notFound: true,
  };

  const isPostLogin = query.isPostLogin === "true";

  // recheck login status in case user cancelled the login
  const { data: userData } = await apolloClient.query<CurrentUserQuery>({
    query: CurrentUserDocument,
  });
  if (pk != null && pk > 0 && isPostLogin && userData?.currentUser != null) {
    const begin = ignoreMaybeArray(query.begin);
    const end = ignoreMaybeArray(query.end);

    if (begin != null && end != null) {
      const input: ReservationCreateMutationInput = {
        begin,
        end,
        reservationUnit: pk,
      };
      const res = await apolloClient.mutate<
        CreateReservationMutation,
        CreateReservationMutationVariables
      >({
        mutation: CreateReservationDocument,
        variables: {
          input,
        },
      });
      const { pk: reservationPk } = res.data?.createReservation ?? {};
      return {
        redirect: {
          destination: getReservationInProgressPath(pk, reservationPk),
          permanent: false,
        },
        props: {
          notFound: true, // required for type narrowing
        },
      };
    }
  }

  if (pk != null && pk > 0) {
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

    const { reservationUnit } = reservationUnitData;
    if (reservationUnit == null) {
      return notFound;
    }
    if (!isReservationUnitPublished(reservationUnit) && !previewPass) {
      return notFound;
    }

    const isDraft = reservationUnit?.isDraft;
    if (isDraft && !previewPass) {
      return notFound;
    }

    const bookingTerms = await getGenericTerms(apolloClient);

    let relatedReservationUnits: RelatedUnitCardFieldsFragment[] = [];
    if (reservationUnit?.unit?.pk) {
      const { data: relatedData } = await apolloClient.query<
        RelatedReservationUnitsQuery,
        RelatedReservationUnitsQueryVariables
      >({
        query: RelatedReservationUnitsDocument,
        variables: {
          unit: [reservationUnit.unit.pk],
        },
      });

      relatedReservationUnits = filterNonNullable(
        relatedData?.reservationUnits?.edges?.map((n) => n?.node)
      ).filter((n) => n?.pk !== reservationUnitData.reservationUnit?.pk);
    }
    const queryParams = new URLSearchParams(query as Record<string, string>);
    const searchDate = queryParams.get("date") ?? null;
    const searchTime = queryParams.get("time") ?? null;
    const searchDuration = toNumber(
      ignoreMaybeArray(queryParams.get("duration"))
    );

    const blockingReservations = filterNonNullable(
      reservationUnitData?.affectingReservations
    );

    return {
      props: {
        ...commonProps,
        ...(await serverSideTranslations(locale ?? "fi")),
        reservationUnit,
        blockingReservations,
        relatedReservationUnits,
        activeApplicationRounds,
        termsOfUse: { genericTerms: bookingTerms },
        searchDuration,
        searchDate,
        searchTime,
      },
    };
  }

  return notFound;
}

const StyledApplicationRoundScheduleDay = styled.p`
  span:first-child {
    display: inline-block;
    font-weight: bold;
    width: 9ch;
    margin-right: var(--spacing-s);
  }
`;

function formatTimeSlot(slot: TimeSlotType): string {
  const { begin, end } = slot;
  if (!begin || !end) {
    return "";
  }
  const beginTime = timeToMinutes(begin);
  const endTime = timeToMinutes(end);
  const endTimeChecked = endTime === 0 ? 24 * 60 : endTime;
  return formatTimeRange(beginTime, endTimeChecked, true);
}

export const APPLICATION_ROUND_TIME_SLOT_FRAGMENT = gql`
  fragment ApplicationRoundTimeSlotFields on ApplicationRoundTimeSlotNode {
    id
    weekday
    closed
    reservableTimes {
      begin
      end
    }
  }
`;

// Returns an element for a weekday in the application round timetable, with up to two timespans
function ApplicationRoundScheduleDay(
  props: ApplicationRoundTimeSlotFieldsFragment
) {
  const { t } = useTranslation();
  const { weekday, reservableTimes, closed } = props;
  return (
    <StyledApplicationRoundScheduleDay>
      <span data-testid="application-round-time-slot__weekday">
        {t(`common:weekDayLong.${fromMondayFirstUnsafe(weekday)}`)}
      </span>{" "}
      {closed ? (
        <span data-testid="application-round-time-slot__value">-</span>
      ) : (
        reservableTimes && (
          <span data-testid="application-round-time-slot__value">
            {reservableTimes[0] && formatTimeSlot(reservableTimes[0])}
            {reservableTimes[1] &&
              ` ${t("common:and")} ${formatTimeSlot(reservableTimes[1])}`}
          </span>
        )
      )}
    </StyledApplicationRoundScheduleDay>
  );
}

function SubmitFragment(
  props: Readonly<{
    focusSlot: FocusTimeSlot;
    apiBaseUrl: string;
    reservationForm: UseFormReturn<PendingReservationFormType>;
    loadingText: string;
    buttonText: string;
  }>
): JSX.Element {
  const { isSubmitting } = props.reservationForm.formState;
  const { focusSlot } = props;
  const { isReservable } = props.focusSlot;
  const returnToUrl = useMemo(() => {
    if (!focusSlot.isReservable) {
      return;
    }
    const { start: begin, end } = focusSlot ?? {};

    const params = new URLSearchParams();
    params.set("begin", begin.toISOString());
    params.set("end", end.toISOString());
    return getPostLoginUrl(params);
  }, [focusSlot]);

  return (
    <LoginFragment
      isActionDisabled={!isReservable}
      apiBaseUrl={props.apiBaseUrl}
      type="reservation"
      componentIfAuthenticated={
        <SubmitButton
          type="submit"
          variant={isSubmitting ? ButtonVariant.Clear : ButtonVariant.Primary}
          iconStart={isSubmitting ? <LoadingSpinner small /> : undefined}
          disabled={!isReservable || isSubmitting}
          data-testid="quick-reservation__button--submit"
        >
          {isSubmitting ? props.loadingText : props.buttonText}
        </SubmitButton>
      }
      returnUrl={returnToUrl}
    />
  );
}

const PageContentWrapper = styled(Flex).attrs({
  $gap: "s",
})`
  grid-column: 1 / -2;

  @media (min-width: ${breakpoints.l}) {
    grid-row: 2 / -1;
    grid-column: 1;
  }
`;

const StyledRelatedUnits = styled(RelatedUnits)`
  grid-row: -1;
  grid-column: 1 / -1;
  max-width: calc(--tilavaraus-page-max-width - var(--spacing-layout-s) * 2);
`;

function ReservationUnit({
  reservationUnit,
  relatedReservationUnits,
  activeApplicationRounds,
  blockingReservations,
  termsOfUse,
  apiBaseUrl,
  searchDuration,
  searchDate,
  searchTime,
}: PropsNarrowed): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const router = useRouter();
  useRemoveStoredReservation();

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

  const { watch } = reservationForm;

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
    const slot = convertFormToFocustimeSlot({
      data,
      reservationUnit,
      reservableTimes,
      activeApplicationRounds,
      blockingReservations,
    });
    if (!slot.isReservable) {
      throw new Error("Reservation slot is not reservable");
    }
    const { start: begin, end } = slot;
    const input: ReservationCreateMutationInput = {
      begin: begin.toISOString(),
      end: end.toISOString(),
      reservationUnit: reservationUnit.pk,
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

  const [createReservationMutation] = useCreateReservationMutation();

  const displayError = useDisplayError();

  const createReservation = async (
    input: ReservationCreateMutationInput
  ): Promise<void> => {
    try {
      if (reservationUnit.pk == null) {
        throw new Error("Reservation unit pk is missing");
      }
      const res = await createReservationMutation({
        variables: {
          input,
        },
      });
      const { pk } = res.data?.createReservation ?? {};
      if (pk == null) {
        throw new Error("Reservation creation failed");
      }
      router.push(getReservationInProgressPath(reservationUnit.pk, pk));
    } catch (err) {
      displayError(err);
    }
  };

  // store reservation unit overall reservability to use in JSX and pass to some child elements
  const { isReservable: reservationUnitIsReservable, reason } =
    isReservationUnitReservable(reservationUnit);
  if (!reservationUnitIsReservable) {
    // eslint-disable-next-line no-console
    console.warn("not reservable because: ", reason);
  }

  const shouldDisplayBottomWrapper = relatedReservationUnits?.length > 0;

  const termsOfUseContent = getTranslationSafe(
    reservationUnit,
    "termsOfUse",
    lang
  );
  const paymentTermsContent = reservationUnit.paymentTerms
    ? getTranslationSafe(reservationUnit.paymentTerms, "text", lang)
    : undefined;
  const cancellationTermsContent = reservationUnit.cancellationTerms
    ? getTranslationSafe(reservationUnit.cancellationTerms, "text", lang)
    : undefined;
  const pricingTermsContent = reservationUnit.pricingTerms
    ? getTranslationSafe(reservationUnit.pricingTerms, "text", lang)
    : undefined;
  const serviceSpecificTermsContent = reservationUnit.serviceSpecificTerms
    ? getTranslationSafe(reservationUnit.serviceSpecificTerms, "text", lang)
    : undefined;

  const equipment = filterNonNullable(reservationUnit.equipments);

  const LoginAndSubmit = useMemo(
    () => (
      <SubmitFragment
        focusSlot={focusSlot}
        apiBaseUrl={apiBaseUrl}
        reservationForm={reservationForm}
        loadingText={t("reservationCalendar:makeReservationLoading")}
        buttonText={t("reservationCalendar:makeReservation")}
      />
    ),
    [apiBaseUrl, focusSlot, reservationForm, t]
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

  return (
    <ReservationUnitPageWrapper>
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
      <div>
        {reservationUnitIsReservable && (
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
          <AddressSection
            unit={reservationUnit.unit}
            title={getReservationUnitName(reservationUnit) ?? "-"}
          />
        </JustForDesktop>
      </div>
      <PageContentWrapper>
        <div data-testid="reservation-unit__description">
          <H4 as="h2">{t("reservationUnit:description")}</H4>
          <Sanitize
            html={getTranslationSafe(reservationUnit, "description", lang)}
          />
        </div>
        {equipment?.length > 0 && (
          <div data-testid="reservation-unit__equipment">
            <H4 as="h2">{t("reservationUnit:equipment")}</H4>
            <EquipmentList equipment={equipment} />
          </div>
        )}
        {reservationUnitIsReservable && (
          <div data-testid="reservation-unit__calendar--wrapper">
            <H4 as="h2">
              {t("reservations:reservationCalendar", {
                title: getTranslationSafe(reservationUnit, "name", lang),
              })}
            </H4>
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
          </div>
        )}
        <ReservationInfoContainer
          reservationUnit={reservationUnit}
          reservationUnitIsReservable={reservationUnitIsReservable}
        />
        {termsOfUseContent && (
          <Accordion
            heading={t("reservationUnit:terms")}
            disableBottomMargin
            headingLevel={2}
            theme="thin"
            data-testid="reservation-unit__reservation-notice"
          >
            <PriceChangeNotice
              reservationUnit={reservationUnit}
              activeApplicationRounds={activeApplicationRounds}
            />
            <Sanitize html={termsOfUseContent} />
          </Accordion>
        )}
        {showApplicationRoundTimeSlots && (
          <Accordion
            disableBottomMargin
            headingLevel={2}
            heading={t("reservationUnit:recurringHeading")}
          >
            <p>{t("reservationUnit:recurringBody")}</p>
            {applicationRoundTimeSlots?.map((day) => (
              <ApplicationRoundScheduleDay key={day.weekday} {...day} />
            ))}
          </Accordion>
        )}
        {reservationUnit.unit?.tprekId && (
          <Accordion
            disableBottomMargin
            heading={t("common:location")}
            theme="thin"
            open
          >
            <JustForMobile customBreakpoint={breakpoints.l}>
              <AddressSection
                unit={reservationUnit.unit}
                title={getReservationUnitName(reservationUnit) ?? "-"}
              />
            </JustForMobile>
            <MapComponent tprekId={reservationUnit.unit?.tprekId ?? ""} />
          </Accordion>
        )}
        {(paymentTermsContent || cancellationTermsContent) && (
          <Accordion
            disableBottomMargin
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
            {paymentTermsContent && <Sanitize html={paymentTermsContent} />}
            <Sanitize html={cancellationTermsContent ?? ""} />
          </Accordion>
        )}
        {shouldDisplayPricingTerms && pricingTermsContent && (
          <Accordion
            heading={t("reservationUnit:pricingTerms")}
            disableBottomMargin
            theme="thin"
            data-testid="reservation-unit__pricing-terms"
          >
            <Sanitize html={pricingTermsContent} />
          </Accordion>
        )}
        <Accordion
          heading={t("reservationUnit:termsOfUse")}
          theme="thin"
          disableBottomMargin
          data-testid="reservation-unit__terms-of-use"
        >
          {serviceSpecificTermsContent && (
            <Sanitize html={serviceSpecificTermsContent} />
          )}
          <Sanitize
            html={getTranslationSafe(
              termsOfUse.genericTerms ?? {},
              "text",
              lang
            )}
          />
        </Accordion>
      </PageContentWrapper>
      <InfoDialog
        id="pricing-terms"
        heading={t("reservationUnit:pricingTerms")}
        text={pricingTermsContent ?? ""}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      {/* TODO this breaks the layout when inside a grid (the RelatedUnits) */}
      {shouldDisplayBottomWrapper && (
        <StyledRelatedUnits units={relatedReservationUnits} />
      )}
    </ReservationUnitPageWrapper>
  );
}

function ReservationUnitWrapped(props: PropsNarrowed) {
  const { t, i18n } = useTranslation();
  const { reservationUnit } = props;
  const lang = convertLanguageCode(i18n.language);
  const reservationUnitName = getTranslationSafe(reservationUnit, "name", lang);
  const routes = [
    { slug: getSingleSearchPath(), title: t("breadcrumb:search") },
    { title: reservationUnitName ?? "-" },
  ] as const;

  return (
    <>
      <Breadcrumb routes={routes} />
      <ReservationUnit {...props} />
    </>
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

  const label = t(
    `reservationCalendar:reservationQuota${
      isReservationQuotaReached ? "Full" : ""
    }Label`
  );

  return (
    <Notification
      type={isReservationQuotaReached ? "alert" : "info"}
      label={label}
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
    </Notification>
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
            tax: formatters.strippedDecimal?.format(taxPercentage),
          })}
        </strong>
      )}
      .
    </p>
  );
}

export default ReservationUnitWrapped;

export const RESERVATION_UNIT_PAGE_QUERY = gql`
  query ReservationUnitPage(
    $id: ID!
    $pk: Int!
    $beginDate: Date!
    $endDate: Date!
    $state: [ReservationStateChoice]
  ) {
    reservationUnit(id: $id) {
      ...ReservationUnitNameFields
      ...AvailableTimesReservationUnitFields
      ...NotReservableFields
      ...ReservationTimePickerFields
      ...MetadataSets
      unit {
        ...AddressFields
      }
      uuid
      ...TermsOfUse
      images {
        ...Image
      }
      isDraft
      applicationRoundTimeSlots {
        ...ApplicationRoundTimeSlotFields
      }
      applicationRounds(ongoing: true) {
        id
        reservationPeriodBegin
        reservationPeriodEnd
      }
      descriptionFi
      descriptionEn
      descriptionSv
      canApplyFreeOfCharge
      reservationUnitType {
        ...ReservationUnitTypeFields
      }
      ...ReservationInfoContainer
      numActiveUserReservations
      publishingState
      equipments {
        id
        ...EquipmentFields
      }
      currentAccessType
      accessTypes(isActiveOrFuture: true, orderBy: [beginDateAsc]) {
        id
        pk
        accessType
        beginDate
      }
    }
    affectingReservations(
      forReservationUnits: [$pk]
      beginDate: $beginDate
      endDate: $endDate
      state: $state
    ) {
      ...BlockingReservationFields
    }
  }
`;

export const RELATED_RESERVATION_UNITS_QUERY = gql`
  query RelatedReservationUnits($unit: [Int]!) {
    reservationUnits(unit: $unit, isVisible: true) {
      edges {
        node {
          ...RelatedUnitCardFields
        }
      }
    }
  }
`;
