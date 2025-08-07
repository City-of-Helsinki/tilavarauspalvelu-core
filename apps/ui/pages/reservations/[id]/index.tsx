import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import { IconArrowRight, IconCalendar, IconCross, IconLinkExternal, IconLock, Notification } from "hds-react";
import { useTranslation } from "next-i18next";
import { Flex, NoWrap, H1, H4, fontRegular } from "common/styled";
import { breakpoints } from "common/src/const";
import {
  ReservationStateChoice,
  type ReservationPageQuery,
  type ReservationPageQueryVariables,
  ReservationPageDocument,
  type ApplicationReservationSeriesQuery,
  type ApplicationReservationSeriesQueryVariables,
  ApplicationReservationSeriesDocument,
  OrderStatus,
  useAccessCodeQuery,
  AccessType,
  type AccessCodeQuery,
  MunicipalityChoice,
  ReservationCancelReasonChoice,
} from "@gql/gql-types";
import Link from "next/link";
import { isBefore, sub } from "date-fns";
import { createApolloClient } from "@/modules/apolloClient";
import { formatDateTimeRange } from "@/modules/util";
import {
  getNormalizedReservationOrderStatus,
  getPaymentUrl,
  getWhyReservationCantBeChanged,
  isReservationCancellable,
} from "@/modules/reservation";
import { getReservationUnitName } from "@/modules/reservationUnit";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { AddressSection } from "@/components/reservation-unit";
import { getCommonServerSideProps, getGenericTerms } from "@/modules/serverUtils";
import { base64encode, capitalize, filterNonNullable, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { ButtonLikeLink, ButtonLikeExternalLink } from "@/components/common/ButtonLikeLink";
import { ReservationPageWrapper } from "@/styled/reservation";
import {
  getApplicationPath,
  getFeedbackUrl,
  getReservationPath,
  getReservationUnitPath,
  type ReservationNotifications,
  reservationsPrefix,
} from "@/modules/urls";
import { useToastIfQueryParam } from "@/hooks";
import { convertLanguageCode } from "common/src/common/util";
import { gql } from "@apollo/client";
import StatusLabel from "common/src/components/StatusLabel";
import IconButton from "common/src/components/IconButton";
import {
  NotModifiableReason,
  Instructions,
  LabelValuePair,
  ReservationStatus,
  ReservationInfoCard,
  ReservationOrderStatus,
  TermsInfoSection,
  GeneralFields,
  ApplicationFields,
  PaymentNotification,
} from "@/components/reservation";
import { useSearchParams } from "next/navigation";
import { queryOptions } from "@/modules/queryOptions";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

// TODO clean this up, way too much css
// also this breaks way too early to two lines (should just have no-wrap on the two elements)
// reason is the way the separator is added
const SubHeading = styled(H4).attrs({
  as: "p",
  $noMargin: true,
})`
  && {
    ${fontRegular}
  }

  /* TODO make this into a css fragment */
  a,
  a:visited {
    color: var(--color-black);
    text-decoration: underline;
    display: block;

    /* TODO the problem here is that it relies on the size of the window instead if we are splitting the line or not */
    @media (min-width: ${breakpoints.m}) {
      &:after {
        content: "|";
        position: relative;
        right: calc(var(--spacing-xs) * -1);
      }
      display: inline-block;
      margin-right: var(--spacing-m);
      margin-bottom: 0;
    }
  }
`;

/* use empty liberally to remove empty elements that add spacing because of margins */
const Actions = styled(Flex).attrs({
  $direction: "row",
  $wrap: "wrap",
})`
  &:empty {
    display: none;
  }
`;

const SecondaryActions = styled(Flex)`
  &:empty {
    display: none;
  }

  margin-top: var(--spacing-l);
`;

function shouldShowStatusNotification(
  reservation: Pick<PropsNarrowed, "reservation">["reservation"],
  param: ReservationNotifications | null
): boolean {
  switch (param) {
    case "confirmed":
    case "requires_handling":
      return reservation.state === param.toUpperCase();
    case "paid":
      return (
        reservation.state === ReservationStateChoice.Confirmed &&
        (reservation.paymentOrder?.status === OrderStatus.Paid ||
          reservation.paymentOrder?.status === OrderStatus.PaidByInvoice)
      );
    default:
      return false;
  }
}

function shouldShowPaymentNotification(reservation: Pick<PropsNarrowed, "reservation">["reservation"]): boolean {
  return (
    (reservation.state === ReservationStateChoice.Confirmed &&
      reservation.paymentOrder?.status === OrderStatus.Pending) ||
    (reservation.state === ReservationStateChoice.Cancelled &&
      reservation.cancelReason === ReservationCancelReasonChoice.NotPaid)
  );
}

/// Type safe "notify" query param converter
function convertNotify(str: string | null): ReservationNotifications | null {
  switch (str) {
    case "requires_handling":
    case "confirmed":
    case "paid":
      return str;
    default:
      return null;
  }
}

// TODO add a state check => if state is Created redirect to the reservation funnel
// if state is Cancelled, Denied, WaitingForPayment what then?
function Reservation({
  termsOfUse,
  reservation,
  feedbackUrl,
  apiBaseUrl,
  options,
}: Readonly<
  Pick<PropsNarrowed, "termsOfUse" | "reservation" | "feedbackUrl" | "options" | "apiBaseUrl">
>): React.ReactElement | null {
  const { t, i18n } = useTranslation();
  const params = useSearchParams();
  const statusNotification = convertNotify(params.get("notify"));
  const shouldShowAccessCode =
    isBefore(sub(new Date(), { days: 1 }), new Date(reservation.endsAt)) &&
    reservation.state === ReservationStateChoice.Confirmed &&
    reservation.accessType === AccessType.AccessCode;

  const { data: accessCodeData } = useAccessCodeQuery({
    skip: !reservation || !shouldShowAccessCode,
    variables: {
      id: base64encode(`ReservationNode:${reservation.pk}`),
    },
  });
  const pindoraInfo = accessCodeData?.reservation?.pindoraInfo ?? null;

  const modifyTimeReason = getWhyReservationCantBeChanged(reservation);
  const canTimeBeModified = modifyTimeReason == null;

  const normalizedOrderStatus = getNormalizedReservationOrderStatus(reservation);

  useToastIfQueryParam({
    key: "timeUpdated",
    message: t("reservations:saveNewTimeSuccess"),
  });

  useToastIfQueryParam({
    key: "deleted",
    message: t("reservations:reservationCancelledTitle"),
  });

  useToastIfQueryParam({
    key: "error_code",
    message:
      params.get("error_code") === "RESERVATION_NOT_CONFIRMED" ||
      params.get("error_code") === "RESERVATION_NOT_FOUND" ||
      params.get("error_code") === "RESERVATION_CANCELLED"
        ? t("reservations:reservationNoLongerPayable")
        : params.get("error_message") || t("error:genericError"),
    type: "error",
  });

  const { beginsAt, endsAt } = reservation;
  const timeString = capitalize(formatDateTimeRange(t, new Date(beginsAt), new Date(endsAt)));

  const supportedFields = filterNonNullable(reservation.reservationUnit.metadataSet?.supportedFields);

  const isBeingHandled = reservation.state === ReservationStateChoice.RequiresHandling;
  const isCancellable = isReservationCancellable(reservation);

  const lang = convertLanguageCode(i18n.language);

  const paymentUrl = getPaymentUrl(reservation, lang, apiBaseUrl);
  const hasCheckoutUrl = paymentUrl != null;
  const isWaitingForPayment = reservation.state === ReservationStateChoice.WaitingForPayment;

  const routes = [
    {
      slug: reservationsPrefix,
      title: t("breadcrumb:reservations"),
    },
    {
      title: t("reservations:reservationName", { id: reservation.pk }),
    },
  ] as const;

  const hasReceipt =
    reservation.paymentOrder?.receiptUrl &&
    (reservation.paymentOrder?.status === OrderStatus.Paid ||
      reservation.paymentOrder?.status === OrderStatus.Refunded ||
      reservation.paymentOrder?.status === OrderStatus.PaidByInvoice);

  return (
    <>
      <Breadcrumb routes={routes} />
      {shouldShowStatusNotification(reservation, statusNotification) && (
        <Notification
          type={statusNotification === "requires_handling" ? "info" : "success"}
          data-testid="reservation__status-notification"
          label={t(`reservations:notifications.${statusNotification}.title`)}
        >
          {t(`reservations:notifications.${statusNotification}.body`)}
        </Notification>
      )}
      <ReservationPageWrapper data-testid="reservation__content" $nRows={3}>
        <Flex style={{ gridColumn: "1 / span 1", gridRow: "1 / span 1" }}>
          <Flex $direction="row" $alignItems="center" $justifyContent="space-between" $wrap="wrap">
            <H1 $noMargin data-testid="reservation__name">
              {t("reservations:reservationName", { id: reservation.pk })}
            </H1>
            <Flex $gap="s" $direction="row">
              <ReservationStatus
                testId="reservation__status"
                state={reservation.state ?? ReservationStateChoice.Confirmed}
              />
              {normalizedOrderStatus && (
                <ReservationOrderStatus orderStatus={normalizedOrderStatus} testId="reservation__payment-status" />
              )}
              {shouldShowAccessCode && (
                <StatusLabel
                  type="info"
                  icon={<IconLock aria-hidden="false" aria-label={t(`reservationUnit:accessType`)} />}
                  data-testid="reservation__access-code"
                >
                  {t("reservationUnit:accessTypes.ACCESS_CODE")}
                </StatusLabel>
              )}
            </Flex>
          </Flex>
          <SubHeading>
            <Link
              data-testid="reservation__reservation-unit"
              href={getReservationUnitPath(reservation.reservationUnit.pk)}
            >
              {getReservationUnitName(reservation.reservationUnit, lang) ?? "-"}
            </Link>
            <NoWrap data-testid="reservation__time">{timeString}</NoWrap>
          </SubHeading>
        </Flex>
        <div style={{ gridRowEnd: "span 3" }}>
          <ReservationInfoCard reservation={reservation} />
          <SecondaryActions>
            {reservation.state === ReservationStateChoice.Confirmed && (
              <ButtonLikeExternalLink
                size="large"
                disabled={!reservation.calendarUrl}
                data-testid="reservation__button--calendar-link"
                href={reservation.calendarUrl ?? ""}
                role="button"
              >
                {t("reservations:saveToCalendar")}
                <IconCalendar />
              </ButtonLikeExternalLink>
            )}
            {hasReceipt && (
              <ButtonLikeExternalLink
                size="large"
                data-testid="reservation__confirmation--button__receipt-link"
                href={`${reservation.paymentOrder?.receiptUrl}&lang=${lang}`}
                target="_blank"
                role="button"
              >
                {t("reservations:downloadReceipt")}
                <IconLinkExternal />
              </ButtonLikeExternalLink>
            )}
          </SecondaryActions>
        </div>
        <div>
          <Actions>
            {isWaitingForPayment && (
              <ButtonLikeExternalLink
                size="large"
                disabled={!hasCheckoutUrl}
                href={paymentUrl}
                data-testid="reservation-detail__button--checkout"
                role="button"
              >
                {t("reservations:payReservation")}
                <IconArrowRight />
              </ButtonLikeExternalLink>
            )}
            {canTimeBeModified && (
              <ButtonLikeLink
                size="large"
                href={getReservationPath(reservation.pk, "edit")}
                data-testid="reservation-detail__button--edit"
                role="button"
              >
                {t("reservations:modifyReservationTime")}
                <IconCalendar />
              </ButtonLikeLink>
            )}
            {isCancellable && (
              <ButtonLikeLink
                size="large"
                href={getReservationPath(reservation.pk, "cancel")}
                data-testid="reservation-detail__button--cancel"
                role="button"
              >
                {t(`reservations:cancel.${isBeingHandled ? "application" : "reservation"}`)}
                <IconCross />
              </ButtonLikeLink>
            )}
          </Actions>
          <NotModifiableReason {...reservation} />
        </div>
        <Flex>
          {shouldShowPaymentNotification(reservation) && (
            <PaymentNotification
              reservation={reservation}
              paymentOrder={reservation.paymentOrder}
              appliedPricing={reservation.appliedPricing}
              apiBaseUrl={apiBaseUrl}
            />
          )}
          <Instructions reservation={reservation} />
          <GeneralFields supportedFields={supportedFields} reservation={reservation} options={options} />
          <ApplicationFields reservation={reservation} options={options} supportedFields={supportedFields} />
          {shouldShowAccessCode && <AccessCodeInfo pindoraInfo={pindoraInfo} feedbackUrl={feedbackUrl} />}
          <TermsInfoSection reservation={reservation} termsOfUse={termsOfUse} />
          <AddressSection
            title={getReservationUnitName(reservation.reservationUnit, lang) ?? "-"}
            unit={reservation.reservationUnit.unit}
          />
        </Flex>
      </ReservationPageWrapper>
    </>
  );
}

function AccessCodeInfo({
  pindoraInfo,
  feedbackUrl,
}: Readonly<
  Pick<NonNullable<AccessCodeQuery["reservation"]>, "pindoraInfo"> & Pick<PropsNarrowed, "feedbackUrl">
>): React.ReactElement {
  const { t, i18n } = useTranslation();
  return (
    <div>
      <H4 as="h2">{t("reservationUnit:accessType")}</H4>
      {pindoraInfo?.accessCodeIsActive ? (
        <>
          <LabelValuePair
            label={t("reservationUnit:accessTypes.ACCESS_CODE")}
            value={pindoraInfo.accessCode ?? "-"}
            testId="reservation__access-code"
          />
          <LabelValuePair
            label={t("reservations:accessCodeDuration")}
            value={formatDateTimeRange(
              t,
              new Date(pindoraInfo.accessCodeBeginsAt),
              new Date(pindoraInfo.accessCodeEndsAt)
            )}
            testId="reservation__access-code-duration"
          />
        </>
      ) : (
        <IconButton
          href={getFeedbackUrl(feedbackUrl, i18n)}
          label={t("reservations:contactSupport")}
          icon={<IconLinkExternal />}
        />
      )}
    </div>
  );
}

// TODO this should return 500 if the backend query fails (not 404), or 400 if the query is incorrect etc.
// typically 500 would be MAX_COMPLEXITY issue (could also make it 400 but 400 should be invalid query, not too complex)
// 500 should not be if the backend is down (which one is that?)
export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const pk = toNumber(ignoreMaybeArray(params?.id));
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const notFound = {
    notFound: true,
    props: {
      // have to double up notFound inside the props to get TS types dynamically
      notFound: true,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };

  if (pk != null && pk > 0) {
    const bookingTerms = await getGenericTerms(apolloClient);

    // NOTE errors will fallback to 404
    const id = base64encode(`ReservationNode:${pk}`);
    const { data } = await apolloClient.query<ReservationPageQuery, ReservationPageQueryVariables>({
      query: ReservationPageDocument,
      fetchPolicy: "no-cache",
      variables: { id },
    });

    const { reservation } = data ?? {};

    if (reservation?.reservationSeries != null) {
      const recurringId = reservation.reservationSeries.id;
      const { data: recurringData } = await apolloClient.query<
        ApplicationReservationSeriesQuery,
        ApplicationReservationSeriesQueryVariables
      >({
        query: ApplicationReservationSeriesDocument,
        variables: { id: recurringId },
      });
      const applicationPk =
        recurringData?.reservationSeries?.allocatedTimeSlot?.reservationUnitOption?.applicationSection?.application?.pk;
      return {
        redirect: {
          permanent: true,
          destination: getApplicationPath(applicationPk, "view"),
        },
        props: {
          notFound: true, // for prop narrowing
        },
      };
    } else if (reservation != null) {
      const options = await queryOptions(apolloClient, locale ?? "");
      return {
        props: {
          ...commonProps,
          ...(await serverSideTranslations(locale ?? "fi")),
          options: {
            ...options,
            municipality: Object.values(MunicipalityChoice).map((value) => ({
              label: value as string,
              value: value,
            })),
          },
          reservation,
          termsOfUse: {
            genericTerms: bookingTerms ?? null,
          },
        },
      };
    }
  }

  return notFound;
}

export default Reservation;

export const GET_APPLICATION_RESERVATION_SERIES_QUERY = gql`
  query ApplicationReservationSeries($id: ID!) {
    reservationSeries(id: $id) {
      id
      allocatedTimeSlot {
        id
        reservationUnitOption {
          id
          applicationSection {
            id
            application {
              id
              pk
            }
          }
        }
      }
    }
  }
`;

export const GET_RESERVATION_PAGE_QUERY = gql`
  query ReservationPage($id: ID!) {
    reservation(id: $id) {
      id
      type
      ...MetaFields
      ...ReservationInfoCard
      ...Instructions
      ...CanReservationBeChanged
      calendarUrl
      ...ReservationPaymentUrl
      paymentOrder {
        id
        receiptUrl
      }
      reservationSeries {
        id
      }
      reservationUnit {
        id
        unit {
          ...AddressFields
        }
        canApplyFreeOfCharge
        ...MetadataSets
        ...TermsOfUse
      }
    }
  }
`;
