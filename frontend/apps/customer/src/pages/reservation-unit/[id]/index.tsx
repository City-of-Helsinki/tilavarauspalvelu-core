import React, { useEffect, useMemo, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { gql } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { addYears } from "date-fns";
import { ButtonVariant, LoadingSpinner } from "hds-react";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import styled from "styled-components";
import { cleanHtmlContent, Sanitize } from "ui/src/components/Sanitize";
import TimeZoneNotification from "ui/src/components/TimeZoneNotification";
import { errorToast } from "ui/src/components/toast";
import { useDisplayError, useToastIfQueryParam } from "ui/src/hooks";
import { formatErrorMessage } from "ui/src/hooks/useDisplayError";
import { type ApiError, getApiErrors } from "ui/src/modules/apolloUtils";
import { breakpoints } from "ui/src/modules/const";
import { formatDate, formatTime, parseUIDate, isValidDate, formatApiDate } from "ui/src/modules/date-utils";
import {
  capitalize,
  createNodeId,
  filterNonNullable,
  getLocalizationLang,
  getTranslation,
  ignoreMaybeArray,
  toNumber,
} from "ui/src/modules/helpers";
import { Flex, H4 } from "ui/src/styled";
import { AddressSection } from "@/components/AddressSection";
import { Breadcrumb } from "@/components/Breadcrumb";
import InfoDialog from "@/components/InfoDialog";
import { LoginFragment } from "@/components/LoginFragment";
import { QuickReservation } from "@/components/QuickReservation";
import { useAvailableTimes, useBlockingReservations, useRemoveStoredReservation, useReservableTimes } from "@/hooks";
import {
  EquipmentList,
  Head,
  RelatedUnits,
  ReservationUnitCalendarSection,
  ReservationUnitMoreDetails,
  SubventionSuffix,
} from "@/lib/reservation-unit/[id]/";
import { createApolloClient } from "@/modules/apolloClient";
import { clampDuration, getMaxReservationDuration, getMinReservationDuration } from "@/modules/reservable";
import {
  convertFormToFocustimeSlot,
  createDateTime,
  type FocusTimeSlot,
  getDurationOptions,
} from "@/modules/reservation";
import { getActivePricing, isReservationUnitPublished, isReservationUnitReservable } from "@/modules/reservationUnit";
import { PendingReservationFormSchema, type PendingReservationFormType } from "@/modules/schemas/reservationUnit";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { JustForDesktop } from "@/modules/style/layout";
import { getReservationInProgressPath, getSingleSearchPath } from "@/modules/urls";
import { getPostLoginUrl } from "@/modules/util";
import { ReservationUnitPageWrapper } from "@/styled/reservation";
import { SubmitButton } from "@/styled/util";
import {
  CreateReservationDocument,
  type CreateReservationMutation,
  type CreateReservationMutationVariables,
  type ReservationCreateMutationInput,
  ReservationUnitPageDocument,
  type ReservationUnitPageQuery,
  type ReservationUnitPageQueryVariables,
  useCreateReservationMutation,
} from "@gql/gql-types";

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
  apiBaseUrl,
  queryParams: { searchDuration, searchDate, searchTime },
  mutationErrors,
}: Readonly<PropsNarrowed>): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const lang = getLocalizationLang(i18n.language);
  const router = useRouter();
  useRemoveStoredReservation();
  const [isPricingTermsDialogOpen, setIsPricingTermsDialogOpen] = useState(false);

  const durationOptions = getDurationOptions(reservationUnit, t);

  const minReservationDurationMinutes = getMinReservationDuration(reservationUnit);
  const maxReservationDurationMinutes = getMaxReservationDuration(reservationUnit);

  const searchUIDate = parseUIDate(searchDate ?? "");
  // TODO should be the first reservable day (the reservableTimeSpans logic is too complex and needs refactoring)
  // i.e. using a naive approach will return empty timespsans either reuse the logic for QuickReservation or refactor
  const defaultDate = new Date();
  const defaultDateString = formatDate(defaultDate);
  const defaultValues = {
    date: searchUIDate != null && isValidDate(searchUIDate) ? (searchDate ?? "") : defaultDateString,
    duration: clampDuration(
      searchDuration ?? 0,
      minReservationDurationMinutes,
      maxReservationDurationMinutes,
      durationOptions
    ),
    time: searchTime ?? formatTime(defaultDate),
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
    const input: ReservationCreateMutationInput = {
      beginsAt: start.toISOString(),
      endsAt: end.toISOString(),
      reservationUnit: reservationUnit.pk,
    };
    return await createReservation(input);
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

  const [createReservationMutation] = useCreateReservationMutation();

  const createReservation = async (input: ReservationCreateMutationInput): Promise<void> => {
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
    console.warn("not reservable because: ", reason);
  }

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

  const pricingTermsContent = reservationUnit.pricingTerms
    ? getTranslation(reservationUnit.pricingTerms, "text", lang)
    : undefined;

  const activePricing = getActivePricing(reservationUnit);

  return (
    <>
      <TimeZoneNotification />
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
            <AddressSection unit={reservationUnit.unit} title={getTranslation(reservationUnit, "name", lang)} />
          </JustForDesktop>
        </div>
        <PageContentWrapper>
          <div data-testid="reservation-unit__description">
            <H4 as="h2">{t("reservationUnit:description")}</H4>
            <Sanitize html={getTranslation(reservationUnit, "description", lang)} />
          </div>
          {activePricing?.materialPriceDescriptionFi &&
            cleanHtmlContent(activePricing?.materialPriceDescriptionFi.trim()).length > 0 && (
              <div>
                <H4 as="h2">{capitalize(t("prices:materialPrice"))}</H4>
                <Sanitize html={getTranslation(activePricing, "materialPriceDescription", lang)} />
              </div>
            )}
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
          <ReservationUnitMoreDetails reservationUnit={reservationUnit} isReservable={reservationUnitIsReservable} />
        </PageContentWrapper>
        <InfoDialog
          id="pricing-terms"
          heading={t("reservationUnit:pricingTerms")}
          text={pricingTermsContent ?? ""}
          isOpen={isPricingTermsDialogOpen}
          onClose={() => setIsPricingTermsDialogOpen(false)}
        />
        <StyledRelatedUnits thisReservationUnitPk={reservationUnit.pk} unitPk={reservationUnit.unit.pk} />
      </ReservationUnitPageWrapper>
    </>
  );
}

function ReservationUnitWrapped(props: PropsNarrowed) {
  const { t, i18n } = useTranslation();
  const { reservationUnit } = props;
  const lang = getLocalizationLang(i18n.language);
  const reservationUnitName = getTranslation(reservationUnit, "name", lang);
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

  const startTime = performance.now();

  const isPostLogin = query.isPostLogin === "true";

  let mutationErrors: ApiError[] | null = null;
  if (pk != null && pk > 0) {
    const beginsAt = ignoreMaybeArray(query.begin);
    const endsAt = ignoreMaybeArray(query.end);
    if (isPostLogin && beginsAt != null && endsAt != null) {
      const input: ReservationCreateMutationInput = {
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
      } catch (error) {
        // Format errors so we can JSON.stringify them and toast them on client
        mutationErrors = getApiErrors(error);
      }
    }

    const today = new Date();
    const startDate = today;
    const endDate = addYears(today, 2);

    let innerStartTime = performance.now();
    // This takes 400ms+ on local server
    const { data: reservationUnitData } = await apolloClient.query<
      ReservationUnitPageQuery,
      ReservationUnitPageQueryVariables
    >({
      query: ReservationUnitPageDocument,
      variables: {
        id: createNodeId("ReservationUnitNode", pk),
        beginDate: formatApiDate(startDate) ?? "",
        endDate: formatApiDate(endDate) ?? "",
      },
    });
    let innerEndTime = performance.now();
    // oxlint-disable-next-line no-console
    console.log("Fetch reservationUnit took:", innerEndTime - innerStartTime, "ms");

    const { reservationUnit } = reservationUnitData;

    if (reservationUnit == null) {
      return notFound;
    }

    const previewPass = uuid === reservationUnitData.reservationUnit?.extUuid;
    if (!isReservationUnitPublished(reservationUnit) && !previewPass) {
      return notFound;
    }

    const isDraft = reservationUnit?.isDraft;
    if (isDraft && !previewPass) {
      return notFound;
    }

    const queryParams = new URLSearchParams(query as Record<string, string>);
    const searchDate = queryParams.get("date") ?? null;
    const searchTime = queryParams.get("time") ?? null;
    const searchDuration = toNumber(ignoreMaybeArray(queryParams.get("duration")));

    const endTime = performance.now();
    // oxlint-disable-next-line no-console
    console.log("SSR fetches took in total:", endTime - startTime, "ms");

    return {
      props: {
        ...commonProps,
        ...(await serverSideTranslations(locale ?? "fi")),
        reservationUnit,
        queryParams: {
          searchDuration,
          searchDate,
          searchTime,
        },
        mutationErrors,
      },
    };
  }

  return notFound;
}

export default ReservationUnitWrapped;

export const RESERVATION_UNIT_PAGE_QUERY = gql`
  query ReservationUnitPage($id: ID!, $beginDate: Date!, $endDate: Date!) {
    reservationUnit(id: $id) {
      id
      pk
      nameFi
      nameEn
      nameSv
      reservationForm
      ...AvailableTimesReservationUnitFields
      ...NotReservableFields
      ...ReservationTimePickerFields
      ...ReservationUnitHead
      ...ReservationUnitMoreDetails
      extUuid
      isDraft
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

export const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: ReservationCreateMutationInput!) {
    createReservation(input: $input) {
      pk
    }
  }
`;
