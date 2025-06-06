import React, { useMemo } from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import {
  IconArrowRight,
  IconCalendar,
  IconCross,
  IconLinkExternal,
  IconLock,
} from "hds-react";
import { useTranslation } from "next-i18next";
import { Flex, NoWrap, H1, H4, fontRegular } from "common/styled";
import { breakpoints } from "common/src/const";
import {
  CustomerTypeChoice,
  ReservationStateChoice,
  type ReservationMetadataFieldNode,
  type ReservationPageQuery,
  type ReservationPageQueryVariables,
  ReservationPageDocument,
  type ApplicationRecurringReservationQuery,
  type ApplicationRecurringReservationQueryVariables,
  ApplicationRecurringReservationDocument,
  OrderStatus,
  useAccessCodeQuery,
  AccessType,
  type AccessCodeQuery,
} from "@gql/gql-types";
import Link from "next/link";
import { isBefore, sub } from "date-fns";
import { createApolloClient } from "@/modules/apolloClient";
import { formatDateTimeRange } from "@/modules/util";
import { Sanitize } from "common/src/components/Sanitize";
import { AccordionWithState as Accordion } from "@/components/Accordion";
import {
  getCheckoutUrl,
  getNormalizedReservationOrderStatus,
  getWhyReservationCantBeChanged,
  isReservationCancellable,
} from "@/modules/reservation";
import {
  getReservationUnitName,
  isReservationUnitFreeOfCharge,
} from "@/modules/reservationUnit";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { AddressSection } from "@/components/reservation-unit";
import {
  getCommonServerSideProps,
  getGenericTerms,
} from "@/modules/serverUtils";
import {
  base64encode,
  capitalize,
  filterNonNullable,
  ignoreMaybeArray,
  toNumber,
} from "common/src/helpers";
import { containsField, containsNameField } from "common/src/metaFieldsHelpers";
import {
  ButtonLikeLink,
  ButtonLikeExternalLink,
} from "@/components/common/ButtonLikeLink";
import { ReservationPageWrapper } from "@/styled/reservation";
import {
  getApplicationPath,
  getFeedbackUrl,
  getReservationPath,
  getReservationUnitPath,
  reservationsPrefix,
} from "@/modules/urls";
import { useToastIfQueryParam } from "@/hooks";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { Instructions } from "@/components/Instructions";
import { gql } from "@apollo/client";
import StatusLabel from "common/src/components/StatusLabel";
import IconButton from "common/src/components/IconButton";
import {
  NotModifiableReason,
  ReservationInfoSection,
  LabelValuePair,
  ReservationStatus,
  ReservationInfoCard,
  ReservationOrderStatus,
} from "@/components/reservation";

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

function formatReserveeName(
  reservation: Pick<NodeT, "reserveeFirstName" | "reserveeLastName">
): string {
  return `${reservation.reserveeFirstName || ""} ${
    reservation.reserveeLastName || ""
  }`.trim();
}

function ReserveeBusinessInfo({
  reservation,
  supportedFields,
}: Readonly<{
  reservation: Pick<
    NodeT,
    | "reserveeOrganisationName"
    | "reserveeId"
    | "reserveeFirstName"
    | "reserveeLastName"
    | "reserveePhone"
    | "reserveeEmail"
  >;
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[];
}>): JSX.Element {
  const { t } = useTranslation();
  const arr = [];
  if (containsField(supportedFields, "reserveeOrganisationName")) {
    arr.push({
      key: "organisationName",
      label: t("reservations:organisationName"),
      value: reservation.reserveeOrganisationName || "-",
      testId: "reservation__reservee-organisation-name",
    });
  }
  if (containsField(supportedFields, "reserveeId")) {
    arr.push({
      key: "id",
      label: t("reservations:reserveeId"),
      value: reservation.reserveeId || "-",
      testId: "reservation__reservee-id",
    });
  }
  if (containsNameField(supportedFields)) {
    arr.push({
      key: "name",
      label: t("reservations:contactName"),
      value: formatReserveeName(reservation),
      testId: "reservation__reservee-name",
    });
  }
  if (containsField(supportedFields, "reserveePhone")) {
    arr.push({
      key: "phone",
      label: t("reservations:contactPhone"),
      value: reservation.reserveePhone ?? "-",
      testId: "reservation__reservee-phone",
    });
  }
  if (containsField(supportedFields, "reserveeEmail")) {
    arr.push({
      key: "email",
      label: t("reservations:contactEmail"),
      value: reservation.reserveeEmail ?? "-",
      testId: "reservation__reservee-email",
    });
  }
  return (
    <>
      {arr.map(({ key, ...rest }) => (
        <LabelValuePair key={key} {...rest} />
      ))}
    </>
  );
}

function ReserveePersonInfo({
  reservation,
  supportedFields,
}: Readonly<{
  reservation: Pick<
    NodeT,
    "reserveeEmail" | "reserveeFirstName" | "reserveeLastName" | "reserveePhone"
  >;
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[];
}>) {
  const { t } = useTranslation();
  const arr = [];
  if (containsNameField(supportedFields)) {
    arr.push({
      key: "name",
      value: formatReserveeName(reservation),
    });
  }
  if (containsField(supportedFields, "reserveePhone")) {
    arr.push({
      key: "phone",
      value: reservation.reserveePhone ?? "-",
    });
  }
  if (containsField(supportedFields, "reserveeEmail")) {
    arr.push({
      key: "email",
      value: reservation.reserveeEmail ?? "-",
    });
  }
  return (
    <>
      {arr
        .map(({ key, value }) => ({
          key,
          label: t(`common:${key}`),
          value,
          testId: `reservation__reservee-${key}`,
        }))
        .map(({ key, ...rest }) => (
          <LabelValuePair key={key} {...rest} />
        ))}
    </>
  );
}

function ReserveeInfo({
  reservation,
  supportedFields,
}: Readonly<{
  reservation: Pick<
    NodeT,
    | "reserveeType"
    | "reserveeOrganisationName"
    | "reserveeId"
    | "reserveeFirstName"
    | "reserveeLastName"
    | "reserveePhone"
    | "reserveeEmail"
  >;
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[];
}>) {
  const { t } = useTranslation();
  const showBusinessFields =
    CustomerTypeChoice.Business === reservation.reserveeType ||
    CustomerTypeChoice.Nonprofit === reservation.reserveeType;

  return (
    <div>
      <H4 as="h2">{t("reservationCalendar:reserverInfo")}</H4>
      {showBusinessFields ? (
        <ReserveeBusinessInfo
          reservation={reservation}
          supportedFields={supportedFields}
        />
      ) : (
        <ReserveePersonInfo
          reservation={reservation}
          supportedFields={supportedFields}
        />
      )}
    </div>
  );
}

// TODO add a state check => if state is Created redirect to the reservation funnel
// if state is Cancelled, Denied, WaitingForPayment what then?
function Reservation({
  termsOfUse,
  reservation,
  feedbackUrl,
}: Readonly<PropsNarrowed>): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const shouldShowAccessCode =
    isBefore(sub(new Date(), { days: 1 }), new Date(reservation.end)) &&
    reservation.state === ReservationStateChoice.Confirmed &&
    reservation.accessType === AccessType.AccessCode;
  const { data: accessCodeData } = useAccessCodeQuery({
    skip: !reservation || !shouldShowAccessCode,
    variables: {
      id: base64encode(`ReservationNode:${reservation.pk}`),
    },
  });
  const pindoraInfo = accessCodeData?.reservation?.pindoraInfo ?? null;

  // NOTE typescript can't type array off index
  const reservationUnit = reservation.reservationUnits.find(() => true);

  const modifyTimeReason = getWhyReservationCantBeChanged(reservation);
  const canTimeBeModified = modifyTimeReason == null;

  const normalizedOrderStatus =
    getNormalizedReservationOrderStatus(reservation);

  useToastIfQueryParam({
    key: "timeUpdated",
    message: t("reservations:saveNewTimeSuccess"),
  });

  useToastIfQueryParam({
    key: "deleted",
    message: t("reservations:reservationCancelledTitle"),
  });

  const { begin, end } = reservation;
  const timeString = capitalize(
    formatDateTimeRange(t, new Date(begin), new Date(end))
  );

  const supportedFields = filterNonNullable(
    reservationUnit?.metadataSet?.supportedFields
  );

  const isBeingHandled =
    reservation.state === ReservationStateChoice.RequiresHandling;
  const isCancellable = isReservationCancellable(reservation);

  const lang = convertLanguageCode(i18n.language);
  const checkoutUrl = getCheckoutUrl(reservation.paymentOrder, lang);

  const hasCheckoutUrl = !!checkoutUrl;
  const isWaitingForPayment =
    reservation.state === ReservationStateChoice.WaitingForPayment;

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
      <ReservationPageWrapper data-testid="reservation__content" $nRows={3}>
        <Flex style={{ gridColumn: "1 / span 1", gridRow: "1 / span 1" }}>
          <Flex
            $direction="row"
            $alignItems="center"
            $justifyContent="space-between"
            $wrap="wrap"
          >
            <H1 $noMargin data-testid="reservation__name">
              {t("reservations:reservationName", { id: reservation.pk })}
            </H1>
            <Flex $gap="s" $direction="row">
              <ReservationStatus
                testId="reservation__status"
                state={reservation.state ?? ReservationStateChoice.Confirmed}
              />
              {normalizedOrderStatus && (
                <ReservationOrderStatus
                  orderStatus={normalizedOrderStatus}
                  testId="reservation__payment-status"
                />
              )}
              {shouldShowAccessCode && (
                <StatusLabel
                  type="info"
                  icon={
                    <IconLock
                      aria-hidden="false"
                      aria-label={t(`reservationUnit:accessType`)}
                    />
                  }
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
              href={getReservationUnitPath(reservationUnit?.pk)}
            >
              {getReservationUnitName(reservationUnit, lang) ?? "-"}
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
              <ButtonLikeLink
                size="large"
                disabled={!hasCheckoutUrl}
                href={checkoutUrl ?? ""}
                data-testid="reservation-detail__button--checkout"
              >
                {t("reservations:payReservation")}
                <IconArrowRight />
              </ButtonLikeLink>
            )}
            {canTimeBeModified && (
              <ButtonLikeLink
                size="large"
                href={getReservationPath(reservation.pk, "edit")}
                data-testid="reservation-detail__button--edit"
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
              >
                {t(
                  `reservations:cancel.${
                    isBeingHandled ? "application" : "reservation"
                  }`
                )}
                <IconCross />
              </ButtonLikeLink>
            )}
          </Actions>
          <NotModifiableReason {...reservation} />
        </div>
        <Flex>
          <Instructions reservation={reservation} />
          <ReservationInfoSection
            reservation={reservation}
            supportedFields={supportedFields}
          />
          <ReserveeInfo
            reservation={reservation}
            supportedFields={supportedFields}
          />
          {shouldShowAccessCode && (
            <AccessCodeInfo
              pindoraInfo={pindoraInfo}
              feedbackUrl={feedbackUrl}
            />
          )}
          <TermsInfo reservation={reservation} termsOfUse={termsOfUse} />
          <AddressSection
            title={getReservationUnitName(reservationUnit, lang) ?? "-"}
            unit={reservationUnit?.unit}
          />
        </Flex>
      </ReservationPageWrapper>
    </>
  );
}

function TermsInfo({
  reservation,
  termsOfUse,
}: Readonly<{
  reservation: Pick<
    NodeT,
    "reservationUnits" | "begin" | "applyingForFreeOfCharge"
  >;
  termsOfUse: PropsNarrowed["termsOfUse"];
}>) {
  const { t, i18n } = useTranslation();
  const reservationUnit = reservation.reservationUnits.find(() => true);

  const shouldDisplayPricingTerms: boolean = useMemo(() => {
    if (!reservationUnit) {
      return false;
    }

    const isFreeOfCharge = isReservationUnitFreeOfCharge(
      reservationUnit.pricings,
      new Date(reservation.begin)
    );

    return (
      reservation.applyingForFreeOfCharge ||
      (reservationUnit.canApplyFreeOfCharge && !isFreeOfCharge)
    );
  }, [reservation, reservationUnit]);

  const lang = convertLanguageCode(i18n.language);
  const paymentTermsContent =
    reservationUnit?.paymentTerms != null
      ? getTranslationSafe(reservationUnit.paymentTerms, "text", lang)
      : undefined;
  const cancellationTermsContent =
    reservationUnit?.cancellationTerms != null
      ? getTranslationSafe(reservationUnit.cancellationTerms, "text", lang)
      : undefined;
  const pricingTermsContent =
    reservationUnit?.pricingTerms != null
      ? getTranslationSafe(reservationUnit?.pricingTerms, "text", lang)
      : undefined;
  const serviceSpecificTermsContent =
    reservationUnit?.serviceSpecificTerms != null
      ? getTranslationSafe(reservationUnit.serviceSpecificTerms, "text", lang)
      : undefined;

  return (
    <div>
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
          data-testid="reservation__payment-and-cancellation-terms"
        >
          {paymentTermsContent && <Sanitize html={paymentTermsContent} />}
          {cancellationTermsContent && (
            <Sanitize html={cancellationTermsContent} />
          )}
        </Accordion>
      )}
      {shouldDisplayPricingTerms && pricingTermsContent && (
        <Accordion
          heading={t("reservationUnit:pricingTerms")}
          theme="thin"
          data-testid="reservation__pricing-terms"
        >
          <Sanitize html={pricingTermsContent} />
        </Accordion>
      )}
      <Accordion
        heading={t("reservationUnit:termsOfUse")}
        theme="thin"
        data-testid="reservation__terms-of-use"
      >
        {serviceSpecificTermsContent && (
          <Sanitize html={serviceSpecificTermsContent} />
        )}
        {termsOfUse?.genericTerms != null && (
          <Sanitize
            html={getTranslationSafe(termsOfUse.genericTerms, "text", lang)}
          />
        )}
      </Accordion>
    </div>
  );
}

function AccessCodeInfo({
  pindoraInfo,
  feedbackUrl,
}: Readonly<
  Pick<NonNullable<AccessCodeQuery["reservation"]>, "pindoraInfo"> &
    Pick<PropsNarrowed, "feedbackUrl">
>): JSX.Element {
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

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

type NodeT = NonNullable<ReservationPageQuery["reservation"]>;

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
    const { data } = await apolloClient.query<
      ReservationPageQuery,
      ReservationPageQueryVariables
    >({
      query: ReservationPageDocument,
      fetchPolicy: "no-cache",
      variables: { id },
    });

    const { reservation } = data ?? {};

    if (reservation?.recurringReservation != null) {
      const recurringId = reservation.recurringReservation.id;
      const { data: recurringData } = await apolloClient.query<
        ApplicationRecurringReservationQuery,
        ApplicationRecurringReservationQueryVariables
      >({
        query: ApplicationRecurringReservationDocument,
        variables: { id: recurringId },
      });
      const applicationPk =
        recurringData?.recurringReservation?.allocatedTimeSlot
          ?.reservationUnitOption?.applicationSection?.application?.pk;
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
      return {
        props: {
          ...commonProps,
          ...(await serverSideTranslations(locale ?? "fi")),
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

export const GET_APPLICATION_RECURRING_RESERVATION_QUERY = gql`
  query ApplicationRecurringReservation($id: ID!) {
    recurringReservation(id: $id) {
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
      pk
      ...ReserveeBillingFields
      ...ReservationInfo
      ...ReservationInfoCard
      ...Instructions
      ...CanReservationBeChanged
      applyingForFreeOfCharge
      calendarUrl
      paymentOrder {
        ...OrderFields
      }
      recurringReservation {
        id
      }
      reservationUnits {
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
