import React, { useEffect, useMemo } from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import { capitalize } from "lodash";
import {
  IconArrowRight,
  IconCalendar,
  IconCross,
  IconLinkExternal,
} from "hds-react";
import { useTranslation } from "next-i18next";
import { H1, H4, fontRegular } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { Flex, NoWrap } from "common/styles/util";
import {
  CustomerTypeChoice,
  ReservationStateChoice,
  type ReservationNode,
  type ReservationMetadataFieldNode,
  ReservationDocument,
  type ReservationQuery,
  type ReservationQueryVariables,
  OrderStatus,
} from "@gql/gql-types";
import Link from "next/link";
import { createApolloClient } from "@/modules/apolloClient";
import { formatDateTimeRange, getTranslation } from "@/modules/util";
import Sanitize from "@/components/common/Sanitize";
import { AccordionWithState as Accordion } from "@/components/Accordion";
import {
  getCheckoutUrl,
  getNormalizedReservationOrderStatus,
  getReservationValue,
  getWhyReservationCantBeChanged,
  isReservationCancellable,
} from "@/modules/reservation";
import {
  getReservationUnitInstructionsKey,
  getReservationUnitName,
  isReservationUnitFreeOfCharge,
} from "@/modules/reservationUnit";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";
import { ReservationStatus } from "@/components/reservation/ReservationStatus";
import { AddressSection } from "@/components/reservation-unit/Address";
import { ReservationInfoCard } from "@/components/reservation/ReservationInfoCard";
import { ReservationOrderStatus } from "@/components/reservation/ReservationOrderStatus";
import {
  getCommonServerSideProps,
  getGenericTerms,
} from "@/modules/serverUtils";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { containsField, containsNameField } from "common/src/metaFieldsHelpers";
import { NotModifiableReason } from "@/components/reservation/NotModifiableReason";
import {
  ButtonLikeLink,
  ButtonLikeExternalLink,
} from "@/components/common/ButtonLikeLink";
import { useRouter } from "next/router";
import { successToast } from "common/src/common/toast";
import { ReservationPageWrapper } from "@/components/reservations/styles";
import { getReservationPath, getReservationUnitPath } from "@/modules/urls";

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

function ReserveeBusinessInfo({
  reservation,
  supportedFields,
}: {
  reservation: NodeT;
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[];
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      {containsField(supportedFields, "reserveeOrganisationName") && (
        <p>
          {t("reservations:organisationName")}:{" "}
          <span data-testid="reservation__reservee-organisation-name">
            {reservation.reserveeOrganisationName || "-"}
          </span>
        </p>
      )}
      {containsField(supportedFields, "reserveeId") && (
        <p>
          {t("reservations:reserveeId")}:
          <span data-testid="reservation__reservee-id">
            {reservation.reserveeId || "-"}
          </span>
        </p>
      )}
      {containsNameField(supportedFields) && (
        <p>
          {t("reservations:contactName")}:{" "}
          <span data-testid="reservation__reservee-name">
            {`${reservation.reserveeFirstName || ""} ${
              reservation.reserveeLastName || ""
            }`.trim()}
          </span>
        </p>
      )}
      {containsField(supportedFields, "reserveePhone") && (
        <p>
          {t("reservations:contactPhone")}:
          <span data-testid="reservation__reservee-phone">
            {reservation.reserveePhone}
          </span>
        </p>
      )}
      {containsField(supportedFields, "reserveeEmail") && (
        <p>
          {t("reservations:contactEmail")}:
          <span data-testid="reservation__reservee-email">
            {reservation.reserveeEmail}
          </span>
        </p>
      )}
    </>
  );
}

function ReserveePersonInfo({
  reservation,
  supportedFields,
}: {
  reservation: NodeT;
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[];
}) {
  const { t } = useTranslation();
  return (
    <>
      {containsNameField(supportedFields) && (
        <p>
          {t("common:name")}:{" "}
          <span data-testid="reservation__reservee-name">
            {`${reservation.reserveeFirstName || ""} ${
              reservation.reserveeLastName || ""
            }`.trim()}
          </span>
        </p>
      )}
      {containsField(supportedFields, "reserveePhone") && (
        <p>
          {t("common:phone")}:
          <span data-testid="reservation__reservee-phone">
            {reservation.reserveePhone || "-"}
          </span>
        </p>
      )}
      {containsField(supportedFields, "reserveeEmail") && (
        <p>
          {t("common:email")}:
          <span data-testid="reservation__reservee-email">
            {reservation.reserveeEmail || "-"}
          </span>
        </p>
      )}
    </>
  );
}

function ReserveeInfo({
  reservation,
  supportedFields,
}: {
  reservation: NodeT;
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[];
}) {
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

function ReservationInfo({
  reservation,
  supportedFields,
}: {
  reservation: NodeT;
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[];
}) {
  const { t } = useTranslation();
  const POSSIBLE_FIELDS = ["purpose", "numPersons", "ageGroup", "description"];
  const fields = POSSIBLE_FIELDS.filter((field) =>
    containsField(supportedFields, field)
  );

  if (fields.length === 0) {
    return null;
  }

  return (
    <div>
      <H4 as="h2">{t("reservationApplication:applicationInfo")}</H4>
      {fields.map((field) => (
        <p key={field}>
          {t(`reservationApplication:label.common.${field}`)}:{" "}
          <span data-testid={`reservation__${field}`}>
            {/* FIXME remove the value function */}
            {getReservationValue(reservation as ReservationNode, field) || "-"}
          </span>
        </p>
      ))}
    </div>
  );
}

function useToastIfUpdated() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const removeTimeUpdatedParam = () => {
      const { pathname, query } = router;
      // NOTE ParsedQuery is a Record<string, string>
      const params = new URLSearchParams(query as Record<string, string>);
      params.delete("timeUpdated");

      router.replace(
        {
          pathname,
          query: params.toString(),
        },
        undefined,
        { shallow: true }
      );
    };
    const q = router.query;

    if (q.timeUpdated) {
      successToast({
        text: t("reservations:saveNewTimeSuccess"),
      });
      removeTimeUpdatedParam();
    }
  }, [router, t]);
}

// TODO add a state check => if state is Created redirect to the reservation funnel
// if state is Cancelled, Denied, WaitingForPayment what then?
function Reservation({
  termsOfUse,
  reservation,
}: PropsNarrowed): JSX.Element | null {
  const { t, i18n } = useTranslation();

  // NOTE typescript can't type array off index
  const order = reservation.paymentOrder.find(() => true);

  const reservationUnit = reservation.reservationUnits?.[0] ?? null;
  const instructionsKey =
    reservation.state != null
      ? getReservationUnitInstructionsKey(reservation.state)
      : undefined;

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

  const paymentTermsContent =
    reservationUnit.paymentTerms != null
      ? getTranslation(reservationUnit.paymentTerms, "text")
      : undefined;
  const cancellationTermsContent =
    reservationUnit.cancellationTerms != null
      ? getTranslation(reservationUnit.cancellationTerms, "text")
      : undefined;
  const pricingTermsContent =
    reservationUnit?.pricingTerms != null
      ? getTranslation(reservationUnit?.pricingTerms, "text")
      : undefined;
  const serviceSpecificTermsContent =
    reservationUnit.serviceSpecificTerms != null
      ? getTranslation(reservationUnit.serviceSpecificTerms, "text")
      : undefined;

  const modifyTimeReason = getWhyReservationCantBeChanged({ reservation });
  const canTimeBeModified = modifyTimeReason == null;

  const normalizedOrderStatus =
    getNormalizedReservationOrderStatus(reservation);

  useToastIfUpdated();

  const { begin, end } = reservation;
  const timeString = capitalize(
    formatDateTimeRange(t, new Date(begin), new Date(end))
  );

  const supportedFields = filterNonNullable(
    reservationUnit.metadataSet?.supportedFields
  );

  const isBeingHandled =
    reservation.state === ReservationStateChoice.RequiresHandling;
  const isCancellable = isReservationCancellable(reservation);

  const checkoutUrl = getCheckoutUrl(order, i18n.language);

  const hasCheckoutUrl = !!checkoutUrl;
  const isWaitingForPayment =
    reservation.state === ReservationStateChoice.WaitingForPayment;

  const routes = [
    {
      slug: "/reservations",
      title: t("breadcrumb:reservations"),
    },
    {
      // NOTE Don't set slug. It hides the mobile breadcrumb
      title: t("reservations:reservationName", { id: reservation.pk }),
    },
  ];

  const hasReceipt =
    order?.receiptUrl &&
    (order.status === OrderStatus.Paid ||
      order.status === OrderStatus.Refunded);

  return (
    <>
      <BreadcrumbWrapper route={routes} />
      <ReservationPageWrapper data-testid="reservation__content" $nRows={3}>
        <Flex style={{ gridColumn: "1 / span 1", gridRow: "1 / span 1" }}>
          <Flex
            $direction="row"
            $align="center"
            $justify="space-between"
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
            </Flex>
          </Flex>
          <SubHeading>
            <Link
              data-testid="reservation__reservation-unit"
              href={getReservationUnitPath(reservationUnit.pk)}
            >
              {getReservationUnitName(reservationUnit)}
            </Link>
            <NoWrap data-testid="reservation__time">{timeString}</NoWrap>
          </SubHeading>
        </Flex>
        <div style={{ gridRowEnd: "span 3" }}>
          <ReservationInfoCard reservation={reservation} type="complete" />
          <SecondaryActions>
            {reservation.state === ReservationStateChoice.Confirmed && (
              <ButtonLikeExternalLink
                size="large"
                disabled={!reservation.calendarUrl}
                data-testid="reservation__button--calendar-link"
                href={reservation.calendarUrl ?? ""}
              >
                {t("reservations:saveToCalendar")}
                <IconCalendar aria-hidden />
              </ButtonLikeExternalLink>
            )}
            {hasReceipt && (
              <ButtonLikeExternalLink
                size="large"
                data-testid="reservation__confirmation--button__receipt-link"
                href={`${order.receiptUrl}&lang=${i18n.language}`}
                target="_blank"
              >
                {t("reservations:downloadReceipt")}
                <IconLinkExternal aria-hidden />
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
                <IconArrowRight aria-hidden />
              </ButtonLikeLink>
            )}
            {canTimeBeModified && (
              <ButtonLikeLink
                size="large"
                href={getReservationPath(reservation.pk, "edit")}
                data-testid="reservation-detail__button--edit"
              >
                {t("reservations:modifyReservationTime")}
                <IconCalendar aria-hidden />
              </ButtonLikeLink>
            )}
            {isCancellable && (
              <ButtonLikeLink
                size="large"
                href={getReservationPath(reservation.pk, "cancel")}
                data-testid="reservation-detail__button--cancel"
              >
                {t(
                  `reservations:cancel${
                    isBeingHandled ? "Application" : "Reservation"
                  }`
                )}
                <IconCross aria-hidden />
              </ButtonLikeLink>
            )}
          </Actions>
          <NotModifiableReason reservation={reservation} />
        </div>
        <Flex>
          {instructionsKey &&
            getTranslation(reservationUnit, instructionsKey) && (
              <div>
                <H4 as="h2">{t("reservations:reservationInfo")}</H4>
                <p>{getTranslation(reservationUnit, instructionsKey)}</p>
              </div>
            )}
          <ReservationInfo
            reservation={reservation}
            supportedFields={supportedFields}
          />
          <ReserveeInfo
            reservation={reservation}
            supportedFields={supportedFields}
          />
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
                  html={getTranslation(termsOfUse.genericTerms, "text")}
                />
              )}
            </Accordion>
          </div>
          <AddressSection reservationUnit={reservationUnit} />
        </Flex>
      </ReservationPageWrapper>
    </>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

type NodeT = NonNullable<ReservationQuery["reservation"]>;

// TODO this should return 500 if the backend query fails (not 404), or 400 if the query is incorrect etc.
// typically 500 would be MAX_COMPLEXITY issue (could also make it 400 but 400 should be invalid query, not too complex)
// 500 should not be if the backend is down (which one is that?)
export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const pk = Number(params?.id);
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  if (isFinite(pk)) {
    const bookingTerms = await getGenericTerms(apolloClient);

    // NOTE errors will fallback to 404
    const id = base64encode(`ReservationNode:${pk}`);
    const { data } = await apolloClient.query<
      ReservationQuery,
      ReservationQueryVariables
    >({
      query: ReservationDocument,
      fetchPolicy: "no-cache",
      variables: { id },
    });

    const { reservation } = data ?? {};
    if (reservation != null) {
      return {
        props: {
          ...commonProps,
          key: `${id}-${locale}`,
          ...(await serverSideTranslations(locale ?? "fi")),
          reservation,
          termsOfUse: {
            genericTerms: bookingTerms ?? null,
          },
        },
      };
    }
  }

  return {
    notFound: true,
    props: {
      // have to double up notFound inside the props to get TS types dynamically
      notFound: true,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Reservation;
