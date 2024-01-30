import React, { useMemo } from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import router from "next/router";
import { camelCase, capitalize, isFinite, trim } from "lodash";
import {
  IconArrowRight,
  IconCalendar,
  IconCross,
  IconLinkExternal,
} from "hds-react";
import { useTranslation } from "next-i18next";
import { H2, H4, fontRegular } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  type Query,
  type QueryTermsOfUseArgs,
  ReservationsReservationReserveeTypeChoices,
  TermsOfUseTermsOfUseTermsTypeChoices,
  ReservationsReservationStateChoices,
} from "common/types/gql-types";
import { parseISO } from "date-fns";
import Link from "next/link";
import { Container } from "common";
import { filterNonNullable } from "common/src/helpers";
import { useSession } from "@/hooks/auth";
import { useReservation, useOrder } from "@/hooks/reservation";
import { genericTermsVariant, reservationUnitPath } from "@/modules/const";
import { createApolloClient } from "@/modules/apolloClient";
import { getTranslation, reservationsUrl } from "@/modules/util";
import { BlackButton, Toast } from "@/styles/util";
import { CenterSpinner } from "@/components/common/common";
import Sanitize from "@/components/common/Sanitize";
import { AccordionWithState as Accordion } from "@/components/common/Accordion";
import {
  canReservationTimeBeChanged,
  canUserCancelReservation,
  getCheckoutUrl,
  getNormalizedReservationOrderStatus,
  getReservationCancellationReason,
  getReservationValue,
} from "@/modules/reservation";
import { TERMS_OF_USE } from "@/modules/queries/reservationUnit";
import {
  getReservationUnitInstructionsKey,
  getReservationUnitName,
  getReservationUnitPrice,
} from "@/modules/reservationUnit";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";
import { ReservationStatus } from "@/components/reservation/ReservationStatus";
import { AddressSection } from "@/components/reservation-unit/Address";
import ReservationInfoCard from "@/components/reservation/ReservationInfoCard";
import { ReservationOrderStatus } from "@/components/reservation/ReservationOrderStatus";
import { getCommonServerSideProps } from "@/modules/serverUtils";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale, params } = ctx;
  const id = Number(params?.id);
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  if (isFinite(id)) {
    const { data: genericTermsData } = await apolloClient.query<
      Query,
      QueryTermsOfUseArgs
    >({
      query: TERMS_OF_USE,
      variables: {
        termsType: TermsOfUseTermsOfUseTermsTypeChoices.GenericTerms,
      },
    });
    const bookingTerms = filterNonNullable(
      genericTermsData?.termsOfUse?.edges?.map((e) => e?.node)
    ).find((edge) => edge.pk === genericTermsVariant.BOOKING);

    return {
      props: {
        ...commonProps,
        key: `${id}-${locale}`,
        ...(await serverSideTranslations(locale ?? "fi")),
        overrideBackgroundColor: "var(--tilavaraus-white)",
        termsOfUse: {
          genericTerms: bookingTerms ?? null,
        },
        id,
      },
    };
  }

  return {
    notFound: true,
    props: {
      ...commonProps,
      termsOfUse: null,
      id: null,
    },
  };
};

// TODO this has margin issues on mobile, there is zero margin on top because some element (breadcrumbs?) is removed on mobile
const Heading = styled(H2).attrs({ as: "h1" })`
  margin-top: 0;
  margin-bottom: var(--spacing-m);
`;

const SubHeading = styled(H4).attrs({ as: "h2" })`
  margin-top: 0;
  margin-bottom: var(--spacing-m);
  line-height: 2rem;
  ${fontRegular}

  a,
  a:visited {
    color: var(--color-black);
    text-decoration: underline;
    display: block;
    margin-bottom: var(--spacing-xs);

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

const StatusContainer = styled.div`
  display: flex;
  gap: var(--spacing-s);
`;

/* use empty liberally to remove empty elements that add spacing because of margins */
const Actions = styled.div`
  &:empty {
    display: none;
  }

  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    button {
      max-width: 300px;
    }
  }

  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
  }
`;

const Reasons = styled.div`
  &:empty {
    display: none;
  }

  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-m);
`;

const ReasonText = styled.div`
  color: var(--color-black-70);
  line-height: var(--lineheight-l);
`;

const SecondaryActions = styled.div`
  &:empty {
    display: none;
  }

  margin-top: var(--spacing-l);
  display: flex;
  gap: var(--spacing-m);
  flex-direction: column;

  @media (min-width: ${breakpoints.s}) {
    > button {
      justify-self: flex-end;
      max-width: 300px;
    }
  }

  @media (min-width: ${breakpoints.m}) {
    display: inline-flex;
    justify-items: flex-end;
  }
`;

const Content = styled.div`
  font-size: var(--fontsize-body-l);
  max-width: 65ch;
`;

const ParagraphHeading = styled(H4).attrs({ as: "h3" })``;

const Paragraph = styled.p`
  white-space: pre-line;
  margin-bottom: var(--spacing-xl);

  & > span {
    display: block;
  }
`;

const ParagraphAlt = styled(Paragraph)`
  margin-bottom: 0;
  & > span {
    display: inline;
  }
`;

const ContentContainer = styled.div`
  margin-bottom: var(--spacing-xl);
  white-space: pre-line;

  div[role="heading"] {
    font-size: var(--fontsize-heading-s);
  }
`;

const AccordionContent = styled.div`
  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-l);
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: var(--spacing-s);
  padding-top: var(--spacing-m);
`;

const Terms = styled.div`
  margin-bottom: var(--spacing-xl);
`;

// TODO top margin is bad, refactor it (also every page should have the same space between Breadcrumb and Heading)
const PageContent = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(4, auto);
  grid-gap: var(--spacing-m);
  justify-content: space-between;
  margin-top: var(--spacing-s);

  @media (width > ${breakpoints.m}) {
    margin-top: var(--spacing-l);
    grid-template-columns: 2fr 1fr;
  }
`;

const Reservation = ({ termsOfUse, id }: Props): JSX.Element | null => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useSession();

  const { reservation, loading, error } = useReservation({
    reservationPk: id ?? 0,
  });
  const { order, isLoading: orderLoading } = useOrder({
    orderUuid: reservation?.orderUuid ?? "",
  });

  const reservationUnit = reservation?.reservationUnits?.[0] ?? null;
  const instructionsKey =
    reservation?.state != null
      ? getReservationUnitInstructionsKey(reservation.state)
      : undefined;

  const shouldDisplayPricingTerms: boolean = useMemo(() => {
    if (!reservation || !reservationUnit) {
      return false;
    }

    const reservationUnitPrice = getReservationUnitPrice({
      reservationUnit,
      pricingDate: reservation?.begin ? new Date(reservation.begin) : undefined,
      asInt: true,
    });

    return (
      reservation.applyingForFreeOfCharge ||
      (reservationUnit.canApplyFreeOfCharge && reservationUnitPrice !== "0")
    );
  }, [reservation, reservationUnit]);

  const paymentTermsContent =
    reservationUnit?.paymentTerms != null
      ? getTranslation(reservationUnit?.paymentTerms, "text")
      : undefined;
  const cancellationTermsContent =
    reservationUnit?.cancellationTerms != null
      ? getTranslation(reservationUnit?.cancellationTerms, "text")
      : undefined;
  const pricingTermsContent =
    reservationUnit?.pricingTerms != null
      ? getTranslation(reservationUnit?.pricingTerms, "text")
      : undefined;
  const serviceSpecificTermsContent =
    reservationUnit?.serviceSpecificTerms != null
      ? getTranslation(reservationUnit?.serviceSpecificTerms, "text")
      : undefined;

  const [canTimeBeModified, modifyTimeReason] = canReservationTimeBeChanged({
    reservation,
  });

  const cancellationReason = useMemo(() => {
    const reason = reservation && getReservationCancellationReason(reservation);
    switch (reason) {
      case "NO_CANCELLATION_RULE":
      case "REQUIRES_HANDLING":
        return "termsAreBinding";
      case "BUFFER":
        return "buffer";
      default:
        return null;
    }
  }, [reservation]);

  // NOTE should never end up here (SSR redirect to login)
  if (!isAuthenticated) {
    return <div>{t("common:error.notAuthenticated")}</div>;
  }

  if (error) {
    return (
      <Toast
        type="error"
        label={t("common:error")}
        position="top-center"
        autoClose={false}
        displayAutoCloseProgress={false}
      >
        {t("common:dataError")}
      </Toast>
    );
  }

  const normalizedOrderStatus = reservation
    ? getNormalizedReservationOrderStatus(reservation)
    : null;

  if (loading || orderLoading) {
    return <CenterSpinner />;
  }

  if (!reservation || !reservationUnit) {
    return null;
  }

  const { begin, end } = reservation;

  const beginDate = t("common:dateWithWeekday", {
    date: begin && parseISO(begin),
  });

  const beginTime = t("common:timeWithPrefixInForm", {
    date: begin && parseISO(begin),
  });

  const endDate = t("common:dateWithWeekday", {
    date: end && parseISO(end),
  });

  const endTime = t("common:timeInForm", {
    date: end && parseISO(end),
  });

  const timeString = capitalize(
    trim(
      `${beginDate} ${beginTime}-${
        endDate !== beginDate ? endDate : ""
      }${endTime}`,
      " - "
    )
  );

  const supportedFields =
    reservationUnit.metadataSet?.supportedFields
      ?.filter((n): n is string => n != null)
      .map(camelCase) ?? [];

  const reservationInfo = [
    "purpose",
    "numPersons",
    "ageGroup",
    "description",
  ].map(
    (field) =>
      supportedFields.includes(field) && (
        <ParagraphAlt key={field}>
          {t(`reservationApplication:label.common.${field}`)}:{" "}
          <span data-testid={`reservation__${field}`}>
            {getReservationValue(reservation, field) || "-"}
          </span>
        </ParagraphAlt>
      )
  );

  const reserveeInfo =
    ReservationsReservationReserveeTypeChoices.Business ===
      reservation.reserveeType ||
    ReservationsReservationReserveeTypeChoices.Nonprofit ===
      reservation.reserveeType ? (
      <>
        {supportedFields.includes("reserveeOrganisationName") && (
          <ParagraphAlt>
            {t("reservations:organisationName")}:{" "}
            <span data-testid="reservation__reservee-organisation-name">
              {reservation.reserveeOrganisationName || "-"}
            </span>
          </ParagraphAlt>
        )}
        {supportedFields.includes("reserveeId") && (
          <ParagraphAlt>
            {t("reservations:reserveeId")}:
            <span data-testid="reservation__reservee-id">
              {reservation.reserveeId || "-"}
            </span>
          </ParagraphAlt>
        )}
        {(supportedFields.includes("reserveeFirstName") ||
          supportedFields.includes("reserveeLastName")) && (
          <ParagraphAlt>
            {t("reservations:contactName")}:{" "}
            <span data-testid="reservation__reservee-name">
              {`${reservation.reserveeFirstName || ""} ${
                reservation.reserveeLastName || ""
              }`.trim()}
            </span>
          </ParagraphAlt>
        )}
        {supportedFields.includes("reserveePhone") && (
          <ParagraphAlt>
            {t("reservations:contactPhone")}:
            <span data-testid="reservation__reservee-phone">
              {reservation.reserveePhone}
            </span>
          </ParagraphAlt>
        )}
        {supportedFields.includes("reserveeEmail") && (
          <ParagraphAlt>
            {t("reservations:contactEmail")}:
            <span data-testid="reservation__reservee-email">
              {reservation.reserveeEmail}
            </span>
          </ParagraphAlt>
        )}
      </>
    ) : (
      <>
        {(supportedFields.includes("reserveeFirstName") ||
          supportedFields.includes("reserveeLastName")) && (
          <ParagraphAlt>
            {t("common:name")}:{" "}
            <span data-testid="reservation__reservee-name">
              {`${reservation.reserveeFirstName || ""} ${
                reservation.reserveeLastName || ""
              }`.trim()}
            </span>
          </ParagraphAlt>
        )}
        {supportedFields.includes("reserveePhone") && (
          <ParagraphAlt>
            {t("common:phone")}:
            <span data-testid="reservation__reservee-phone">
              {reservation.reserveePhone || "-"}
            </span>
          </ParagraphAlt>
        )}
        {supportedFields.includes("reserveeEmail") && (
          <ParagraphAlt>
            {t("common:email")}:
            <span data-testid="reservation__reservee-email">
              {reservation.reserveeEmail || "-"}
            </span>
          </ParagraphAlt>
        )}
      </>
    );

  const isReservationCancelled = reservation?.state === "CANCELLED";
  const isBeingHandled = reservation?.state === "REQUIRES_HANDLING";

  const isReservationCancellable =
    canUserCancelReservation(reservation) &&
    !isReservationCancelled &&
    !isBeingHandled;

  const checkoutUrl = getCheckoutUrl(order, i18n.language);

  const hasCheckoutUrl = !!checkoutUrl;
  const isWaitingForPayment =
    reservation.state === ReservationsReservationStateChoices.WaitingForPayment;

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

  return (
    <>
      <BreadcrumbWrapper route={routes} />
      <Container>
        <PageContent data-testid="reservation__content">
          <div style={{ gridColumn: "1 / span 1", gridRow: "1 / span 1" }}>
            <Heading data-testid="reservation__name">
              {t("reservations:reservationName", { id: reservation.pk })}
            </Heading>
            <SubHeading>
              <Link
                data-testid="reservation__reservation-unit"
                href={`${reservationUnitPath(reservationUnit.pk ?? 0)}`}
              >
                {getReservationUnitName(reservationUnit)}
              </Link>
              <span data-testid="reservation__time">{timeString}</span>
            </SubHeading>
            <StatusContainer>
              <ReservationStatus
                data-testid="reservation__status"
                state={reservation.state}
              />
              {normalizedOrderStatus && (
                <ReservationOrderStatus
                  orderStatus={normalizedOrderStatus}
                  data-testid="reservation__status"
                />
              )}
            </StatusContainer>
          </div>
          <div style={{ gridRowEnd: "span 3" }}>
            <ReservationInfoCard
              reservation={reservation}
              reservationUnit={reservationUnit}
              type="complete"
            />
            <SecondaryActions>
              {reservation.state ===
                ReservationsReservationStateChoices.Confirmed && (
                <BlackButton
                  variant="secondary"
                  iconRight={<IconCalendar aria-hidden />}
                  disabled={!reservation.calendarUrl}
                  data-testid="reservation__button--calendar-link"
                  onClick={() => router.push(reservation.calendarUrl ?? "")}
                >
                  {t("reservations:saveToCalendar")}
                </BlackButton>
              )}
              {order?.receiptUrl &&
                // TODO enum comparison (not string)
                ["PAID", "REFUNDED"].includes(order?.status ?? "") && (
                  <BlackButton
                    data-testid="reservation__confirmation--button__receipt-link"
                    onClick={() =>
                      window.open(
                        `${order.receiptUrl}&lang=${i18n.language}`,
                        "_blank"
                      )
                    }
                    variant="secondary"
                    iconRight={<IconLinkExternal aria-hidden />}
                  >
                    {t("reservations:downloadReceipt")}
                  </BlackButton>
                )}
            </SecondaryActions>
          </div>
          <div>
            <Actions>
              {isWaitingForPayment && (
                <BlackButton
                  variant="secondary"
                  disabled={!hasCheckoutUrl}
                  iconRight={<IconArrowRight aria-hidden />}
                  onClick={() => {
                    const url = getCheckoutUrl(order, i18n.language);
                    if (url) router.push(url);
                  }}
                  data-testid="reservation-detail__button--checkout"
                >
                  {t("reservations:payReservation")}
                </BlackButton>
              )}
              {canTimeBeModified && (
                <BlackButton
                  variant="secondary"
                  iconRight={<IconCalendar aria-hidden />}
                  onClick={() => {
                    router.push(`${reservationsUrl}${reservation.pk}/edit`);
                  }}
                  data-testid="reservation-detail__button--edit"
                >
                  {t("reservations:modifyReservationTime")}
                </BlackButton>
              )}
              {isReservationCancellable && (
                <BlackButton
                  variant="secondary"
                  iconRight={<IconCross aria-hidden />}
                  onClick={() =>
                    router.push(`${reservationsUrl}${reservation.pk}/cancel`)
                  }
                  data-testid="reservation-detail__button--cancel"
                >
                  {t(
                    `reservations:cancel${
                      isBeingHandled ? "Application" : "Reservation"
                    }`
                  )}
                </BlackButton>
              )}
            </Actions>
            <Reasons>
              {modifyTimeReason && (
                <ReasonText>
                  {t(`reservations:modifyTimeReasons:${modifyTimeReason}`)}
                  {modifyTimeReason ===
                    "RESERVATION_MODIFICATION_NOT_ALLOWED" &&
                    isReservationCancellable &&
                    ` ${t(
                      "reservations:modifyTimeReasons:RESERVATION_MODIFICATION_NOT_ALLOWED_SUFFIX"
                    )}`}
                </ReasonText>
              )}
              {cancellationReason && !modifyTimeReason && (
                <ReasonText>
                  {t(`reservations:cancellationReasons:${cancellationReason}`)}
                </ReasonText>
              )}
            </Reasons>
          </div>
          <Content>
            {instructionsKey &&
              getTranslation(reservationUnit, instructionsKey) && (
                <ContentContainer>
                  <ParagraphHeading>
                    {t("reservations:reservationInfo")}
                  </ParagraphHeading>
                  <Paragraph>
                    {getTranslation(reservationUnit, instructionsKey)}
                  </Paragraph>
                </ContentContainer>
              )}
            <ParagraphHeading>
              {t("reservationApplication:applicationInfo")}
            </ParagraphHeading>
            <ContentContainer>{reservationInfo}</ContentContainer>
            <ParagraphHeading>
              {t("reservationCalendar:reserverInfo")}
            </ParagraphHeading>
            <ContentContainer>{reserveeInfo}</ContentContainer>
            <Terms>
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
                  {paymentTermsContent != null && (
                    <AccordionContent>
                      <Sanitize html={paymentTermsContent} />
                    </AccordionContent>
                  )}
                  {cancellationTermsContent != null && (
                    <AccordionContent>
                      <Sanitize html={cancellationTermsContent} />
                    </AccordionContent>
                  )}
                </Accordion>
              )}
              {shouldDisplayPricingTerms && pricingTermsContent && (
                <Accordion
                  heading={t("reservationUnit:pricingTerms")}
                  theme="thin"
                  data-testid="reservation__pricing-terms"
                >
                  <AccordionContent>
                    <Sanitize html={pricingTermsContent} />
                  </AccordionContent>
                </Accordion>
              )}
              <Accordion
                heading={t("reservationUnit:termsOfUse")}
                theme="thin"
                data-testid="reservation__terms-of-use"
              >
                {serviceSpecificTermsContent && (
                  <AccordionContent>
                    <Sanitize html={serviceSpecificTermsContent} />
                  </AccordionContent>
                )}
                <AccordionContent>
                  {termsOfUse?.genericTerms != null && (
                    <Sanitize
                      html={getTranslation(termsOfUse.genericTerms, "text")}
                    />
                  )}
                </AccordionContent>
              </Accordion>
            </Terms>
            <AddressSection reservationUnit={reservationUnit} />
          </Content>
        </PageContent>
      </Container>
    </>
  );
};

export default Reservation;
