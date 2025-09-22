import React, { useEffect, useMemo, useState } from "react";
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
import { formatters as getFormatters } from "common";
import { Flex, H4 } from "common/styled";
import { breakpoints } from "common/src/const";
import {
  CreateReservationDocument,
  CurrentUserDocument,
  RelatedReservationUnitsDocument,
  ReservationUnitPageDocument,
  useCreateReservationMutation,
} from "@gql/gql-types";
import type {
  ApplicationRoundTimeSlotFieldsFragment,
  CreateReservationMutation,
  CreateReservationMutationVariables,
  CurrentUserQuery,
  PricingFieldsFragment,
  RelatedReservationUnitsQuery,
  RelatedReservationUnitsQueryVariables,
  RelatedUnitCardFieldsFragment,
  ReservationCreateMutation,
  ReservationUnitPageQuery,
  ReservationUnitPageQueryVariables,
  TimeSlotType,
} from "@gql/gql-types";
import {
  createNodeId,
  filterNonNullable,
  formatListToCSV,
  formatTimeRange,
  getNode,
  ignoreMaybeArray,
  isPriceFree,
  timeToMinutes,
  toNumber,
} from "common/src/helpers";
import { Sanitize } from "common/src/components/Sanitize";
import { createApolloClient } from "@/modules/apolloClient";
import { Map as MapComponent } from "@/components/Map";
import { getPostLoginUrl } from "@/modules/util";
import {
  getFuturePricing,
  getPriceString,
  getReservationUnitName,
  getTimeString,
  isReservationUnitPublished,
  isReservationUnitReservable,
} from "@/modules/reservationUnit";
import { JustForDesktop, JustForMobile } from "@/modules/style/layout";
import { convertFormToFocustimeSlot, createDateTime, getDurationOptions } from "@/modules/reservation";
import type { FocusTimeSlot } from "@/modules/reservation";
import { clampDuration, getMaxReservationDuration, getMinReservationDuration } from "@/modules/reservable";
import { SubventionSuffix } from "@/components/reservation";
import { InfoDialog } from "@/components/common/InfoDialog";
import {
  AddressSection,
  EquipmentList,
  Head,
  RelatedUnits,
  ReservationInfoSection,
  ReservationUnitCalendarSection,
} from "@/components/reservation-unit";
import { getCommonServerSideProps, getGenericTerms } from "@/modules/serverUtils";
import { useForm } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PendingReservationFormSchema } from "@/components/reservation-unit/schema";
import type { PendingReservationFormType } from "@/components/reservation-unit/schema";
import { LoginFragment } from "@/components/LoginFragment";
import { SubmitButton } from "@/styled/util";
import { ReservationUnitPageWrapper } from "@/styled/reservation";
import { getReservationInProgressPath, getSingleSearchPath } from "@/modules/urls";
import { Accordion, ButtonVariant, LoadingSpinner } from "hds-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { useDisplayError } from "common/src/hooks";
import {
  useAvailableTimes,
  useBlockingReservations,
  useRemoveStoredReservation,
  useToastIfQueryParam,
  useReservableTimes,
} from "@/hooks";
import { gql } from "@apollo/client";
import { getApiErrors } from "common/src/apolloUtils";
import type { ApiError } from "common/src/apolloUtils";
import { formatErrorMessage } from "common/src/hooks/useDisplayError";
import { errorToast } from "common/src/components/toast";
import { QuickReservation } from "@/components/QuickReservation";

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
    isClosed
    reservableTimes {
      begin
      end
    }
  }
`;

// Returns an element for a weekday in the application round timetable, with up to two timespans
function ApplicationRoundScheduleDay(props: ApplicationRoundTimeSlotFieldsFragment) {
  const { t } = useTranslation();
  const { weekday, isClosed } = props;
  const reservableTimes = filterNonNullable(props.reservableTimes);
  return (
    <StyledApplicationRoundScheduleDay>
      <span data-testid="application-round-time-slot__weekday">{t(`common:weekdayLongEnum.${weekday}`)}</span>{" "}
      {isClosed ? (
        <span data-testid="application-round-time-slot__value">-</span>
      ) : (
        reservableTimes.length > 0 && (
          <span data-testid="application-round-time-slot__value">
            {formatListToCSV(
              t,
              reservableTimes.map((slot) => formatTimeSlot(slot))
            )}
          </span>
        )
      )}
    </StyledApplicationRoundScheduleDay>
  );
}

function SubmitFragment({
  apiBaseUrl,
  focusSlot,
  buttonText,
  loadingText,
  reservationForm,
}: Readonly<{
  focusSlot: FocusTimeSlot;
  apiBaseUrl: string;
  reservationForm: UseFormReturn<PendingReservationFormType>;
  loadingText: string;
  buttonText: string;
}>): JSX.Element {
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

  const { isReservable } = focusSlot;
  const { isSubmitting } = reservationForm.formState;
  return (
    <LoginFragment
      isActionDisabled={!isReservable}
      apiBaseUrl={apiBaseUrl}
      type="reservation"
      componentIfAuthenticated={
        <SubmitButton
          type="submit"
          variant={isSubmitting ? ButtonVariant.Clear : ButtonVariant.Primary}
          iconStart={isSubmitting ? <LoadingSpinner small /> : undefined}
          disabled={!isReservable || isSubmitting}
          data-testid="quick-reservation__button--submit"
        >
          {isSubmitting ? loadingText : buttonText}
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
  termsOfUse,
  apiBaseUrl,
  searchDuration,
  searchDate,
  searchTime,
  mutationErrors,
}: Readonly<PropsNarrowed>): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const router = useRouter();
  useRemoveStoredReservation();

  const [isPricingTermsDialogOpen, setIsPricingTermsDialogOpen] = useState(false);

  const durationOptions = getDurationOptions(reservationUnit, t);

  const minReservationDurationMinutes = getMinReservationDuration(reservationUnit);
  const maxReservationDurationMinutes = getMaxReservationDuration(reservationUnit);

  const searchUIDate = fromUIDate(searchDate ?? "");
  // TODO should be the first reservable day (the reservableTimeSpans logic is too complex and needs refactoring)
  // i.e. using a naive approach will return empty timespsans either reuse the logic for QuickReservation or refactor
  const defaultDate = new Date();
  const defaultDateString = toUIDate(defaultDate);
  const defaultValues = {
    date: searchUIDate != null && isValidDate(searchUIDate) ? (searchDate ?? "") : defaultDateString,
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

  const displayError = useDisplayError();

  useEffect(() => {
    if (mutationErrors != null && mutationErrors.length > 0) {
      const msgs = mutationErrors.map((e) => formatErrorMessage(t, e));
      for (const text of msgs) {
        errorToast({
          text,
        });
      }
    }
  }, [mutationErrors, t]);

  const focusDate = useMemo(() => {
    return createDateTime(dateValue, timeValue);
  }, [dateValue, timeValue]);

  const activeApplicationRounds = reservationUnit.applicationRounds;
  const { blockingReservations } = useBlockingReservations(reservationUnit.pk);

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
    const { start, end } = slot;
    const input: ReservationCreateMutation = {
      beginsAt: start.toISOString(),
      endsAt: end.toISOString(),
      reservationUnit: reservationUnit.pk,
    };
    const response = await createReservation(input);
    return response;
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

  const createReservation = async (input: ReservationCreateMutation): Promise<void> => {
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
  const { isReservable: reservationUnitIsReservable, reason } = isReservationUnitReservable(reservationUnit);
  if (!reservationUnitIsReservable) {
    // eslint-disable-next-line no-console
    console.warn("not reservable because:", reason);
  }

  const shouldDisplayBottomWrapper = relatedReservationUnits?.length > 0;

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

  useToastIfQueryParam({
    key: "invalidReservation",
    type: "error",
    message: t("reservationCalendar:errors.invalidReservationRedirect"),
  });

  const { startingTimeOptions, nextAvailableTime } = useAvailableTimes({
    date: focusDate,
    duration: durationValue,
    reservableTimes,
    reservationUnit,
    activeApplicationRounds,
    blockingReservations,
  });

  const subventionSuffix = useMemo(
    () =>
      reservationUnit.canApplyFreeOfCharge ? (
        <SubventionSuffix setIsDialogOpen={setIsPricingTermsDialogOpen} />
      ) : undefined,
    [reservationUnit.canApplyFreeOfCharge]
  );

  return (
    <ReservationUnitPageWrapper>
      <Head
        reservationUnit={reservationUnit}
        reservationUnitIsReservable={reservationUnitIsReservable}
        subventionSuffix={subventionSuffix}
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
            subventionSuffix={subventionSuffix}
          />
        )}
        <JustForDesktop customBreakpoint={breakpoints.l}>
          <AddressSection unit={reservationUnit.unit} title={getReservationUnitName(reservationUnit) ?? "-"} />
        </JustForDesktop>
      </div>
      <PageContentWrapper>
        <div data-testid="reservation-unit__description">
          <H4 as="h2">{t("reservationUnit:description")}</H4>
          <Sanitize html={getTranslationSafe(reservationUnit, "description", lang)} />
        </div>
        {equipment.length > 0 && (
          <div data-testid="reservation-unit__equipment">
            <H4 as="h2">{t("reservationUnit:equipment")}</H4>
            <EquipmentList equipment={equipment} />
          </div>
        )}
        {reservationUnitIsReservable && (
          <ReservationUnitCalendarSection
            reservationUnit={reservationUnit}
            reservationForm={reservationForm}
            startingTimeOptions={startingTimeOptions}
            blockingReservations={blockingReservations}
            loginAndSubmitButton={LoginAndSubmit}
            submitReservation={submitReservation}
          />
        )}
        <ReservationInfoSection
          reservationUnit={reservationUnit}
          reservationUnitIsReservable={reservationUnitIsReservable}
        />
        <NoticeWhenReservingSection reservationUnit={reservationUnit} />
        {showApplicationRoundTimeSlots && (
          <Accordion headingLevel={2} heading={t("reservationUnit:recurringHeading")} closeButton={false}>
            <p>{t("reservationUnit:recurringBody")}</p>
            {applicationRoundTimeSlots.map((day) => (
              <ApplicationRoundScheduleDay key={day.weekday} {...day} />
            ))}
          </Accordion>
        )}
        {reservationUnit.unit?.tprekId && (
          <Accordion closeButton={false} heading={t("common:location")} initiallyOpen>
            <JustForMobile customBreakpoint={breakpoints.l}>
              <AddressSection unit={reservationUnit.unit} title={getReservationUnitName(reservationUnit) ?? "-"} />
            </JustForMobile>
            <MapComponent tprekId={reservationUnit.unit?.tprekId ?? ""} />
          </Accordion>
        )}
        {(paymentTermsContent || cancellationTermsContent) && (
          <Accordion
            heading={t(`reservationUnit:${paymentTermsContent ? "paymentAndCancellationTerms" : "cancellationTerms"}`)}
            closeButton={false}
            data-testid="reservation-unit__payment-and-cancellation-terms"
          >
            {paymentTermsContent && <Sanitize html={paymentTermsContent} />}
            <Sanitize html={cancellationTermsContent ?? ""} />
          </Accordion>
        )}
        {shouldDisplayPricingTerms && pricingTermsContent && (
          <Accordion
            heading={t("reservationUnit:pricingTerms")}
            closeButton={false}
            data-testid="reservation-unit__pricing-terms"
          >
            <Sanitize html={pricingTermsContent} />
          </Accordion>
        )}
        <Accordion
          heading={t("reservationUnit:termsOfUse")}
          closeButton={false}
          data-testid="reservation-unit__terms-of-use"
        >
          {serviceSpecificTermsContent && <Sanitize html={serviceSpecificTermsContent} />}
          <Sanitize html={getTranslationSafe(termsOfUse.genericTerms ?? {}, "text", lang)} />
        </Accordion>
      </PageContentWrapper>
      <InfoDialog
        id="pricing-terms"
        heading={t("reservationUnit:pricingTerms")}
        text={pricingTermsContent ?? ""}
        isOpen={isPricingTermsDialogOpen}
        onClose={() => setIsPricingTermsDialogOpen(false)}
      />
      {/* TODO this breaks the layout when inside a grid (the RelatedUnits) */}
      {shouldDisplayBottomWrapper && <StyledRelatedUnits units={relatedReservationUnits} />}
    </ReservationUnitPageWrapper>
  );
}

function ReservationUnitWrapped(props: PropsNarrowed) {
  const { t, i18n } = useTranslation();
  const { reservationUnit } = props;
  const lang = convertLanguageCode(i18n.language);
  const reservationUnitName = getTranslationSafe(reservationUnit, "name", lang);
  const routes = [
    { slug: getSingleSearchPath(), title: t("breadcrumb:searchSingle") },
    { title: reservationUnitName ?? "-" },
  ] as const;

  return (
    <>
      <Breadcrumb routes={routes} />
      <ReservationUnit {...props} />
    </>
  );
}

function NoticeWhenReservingSection({
  reservationUnit,
}: {
  reservationUnit: PropsNarrowed["reservationUnit"];
}): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const notesWhenReserving = getTranslationSafe(reservationUnit, "notesWhenApplying", lang);

  const appRounds = reservationUnit.applicationRounds;
  const futurePricing = getFuturePricing(reservationUnit, appRounds);

  if (!futurePricing && !notesWhenReserving) {
    return null;
  }
  return (
    <Accordion
      heading={t("reservationUnit:terms")}
      headingLevel={2}
      closeButton={false}
      data-testid="reservation-unit__reservation-notice"
    >
      {futurePricing && <PriceChangeNotice futurePricing={futurePricing} />}
      {notesWhenReserving && <Sanitize html={notesWhenReserving} />}
    </Accordion>
  );
}

function PriceChangeNotice({ futurePricing }: { futurePricing: PricingFieldsFragment }): JSX.Element {
  const { t, i18n } = useTranslation();

  const isPaid = !isPriceFree(futurePricing);
  const taxPercentage = toNumber(futurePricing.taxPercentage.value) ?? 0;
  const begins = new Date(futurePricing.begins);
  const priceString = getPriceString({
    t,
    pricing: futurePricing,
  }).toLocaleLowerCase();
  const showTaxNotice = isPaid && taxPercentage > 0;
  const formatters = getFormatters(i18n.language);

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
  let mutationErrors: ApiError[] | null = null;
  if (pk != null && pk > 0 && isPostLogin && userData?.currentUser != null) {
    const beginsAt = ignoreMaybeArray(query.begin);
    const endsAt = ignoreMaybeArray(query.end);

    if (beginsAt != null && endsAt != null) {
      const input: ReservationCreateMutation = {
        beginsAt,
        endsAt,
        reservationUnit: pk,
      };

      try {
        const res = await apolloClient.mutate<CreateReservationMutation, CreateReservationMutationVariables>({
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
      } catch (err) {
        // Format errors so we can JSON.stringify them and toast them on client
        mutationErrors = getApiErrors(err);
      }
    }
  }

  if (pk != null && pk > 0) {
    const today = new Date();
    const startDate = today;
    const endDate = addYears(today, 2);

    const { data: reservationUnitData } = await apolloClient.query<
      ReservationUnitPageQuery,
      ReservationUnitPageQueryVariables
    >({
      query: ReservationUnitPageDocument,
      variables: {
        id: createNodeId("ReservationUnitNode", pk),
        beginDate: toApiDate(startDate) ?? "",
        endDate: toApiDate(endDate) ?? "",
      },
    });

    const reservationUnit = getNode(reservationUnitData);

    if (reservationUnit == null) {
      return notFound;
    }

    const previewPass = uuid === reservationUnit?.extUuid;
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
      relatedReservationUnits = filterNonNullable(relatedData?.reservationUnits?.edges?.map((n) => n?.node)).filter(
        (n) => n?.pk !== reservationUnit?.pk
      );
    }

    const queryParams = new URLSearchParams(query as Record<string, string>);
    const searchDate = queryParams.get("date") ?? null;
    const searchTime = queryParams.get("time") ?? null;
    const searchDuration = toNumber(ignoreMaybeArray(queryParams.get("duration")));

    return {
      props: {
        ...commonProps,
        ...(await serverSideTranslations(locale ?? "fi")),
        reservationUnit,
        relatedReservationUnits,
        termsOfUse: { genericTerms: bookingTerms },
        searchDuration,
        searchDate,
        searchTime,
        mutationErrors,
      },
    };
  }

  return notFound;
}

export default ReservationUnitWrapped;

export const RESERVATION_UNIT_PAGE_QUERY = gql`
  query ReservationUnitPage(
    # Filter
    $id: ID!
    $beginDate: Date! # Used in fragments
    $endDate: Date! # Used in fragments
  ) {
    node(id: $id) {
      ... on ReservationUnitNode {
        id
        pk
        nameFi
        nameEn
        nameSv
        ...AvailableTimesReservationUnitFields
        ...NotReservableFields
        ...ReservationTimePickerFields
        ...MetadataSets
        ...ReservationUnitHead
        unit {
          ...AddressFields
        }
        extUuid
        ...TermsOfUse
        isDraft
        applicationRoundTimeSlots {
          ...ApplicationRoundTimeSlotFields
        }
        descriptionFi
        descriptionEn
        descriptionSv
        canApplyFreeOfCharge
        ...ReservationInfoSection
        ...ReservationQuotaReached
        publishingState
        equipments {
          id
          ...EquipmentFields
        }
      }
    }
  }
`;

export const RELATED_RESERVATION_UNITS_QUERY = gql`
  query RelatedReservationUnits($unit: [Int!]!) {
    reservationUnits(filter: { unit: $unit, isVisible: true }) {
      edges {
        node {
          ...RelatedUnitCardFields
        }
      }
    }
  }
`;

export const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: ReservationCreateMutation!) {
    createReservation(input: $input) {
      pk
    }
  }
`;
