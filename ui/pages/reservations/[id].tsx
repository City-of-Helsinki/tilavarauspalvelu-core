import React, { useEffect, useMemo, useState } from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import router from "next/router";
import { camelCase, capitalize, get, isFinite, trim } from "lodash";
import { IconCalendar, IconCross, IconLinkExternal } from "hds-react";
import { useLazyQuery, useQuery } from "@apollo/client";
import { useTranslation } from "next-i18next";
import { H2, H4, fontRegular } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { signIn, useSession } from "next-auth/react";
import {
  Query,
  QueryReservationByPkArgs,
  QueryTermsOfUseArgs,
  ReservationsReservationReserveeTypeChoices,
  ReservationType,
  TermsOfUseType,
  TermsOfUseTermsOfUseTermsTypeChoices,
  ReservationsReservationStateChoices,
  QueryOrderArgs,
  PaymentOrderType,
} from "common/types/gql-types";
import { parseISO } from "date-fns";
import Link from "next/link";
import apolloClient from "../../modules/apolloClient";
import { GET_ORDER, GET_RESERVATION } from "../../modules/queries/reservation";
import {
  JustForDesktop,
  JustForMobile,
  NarrowCenteredContainer,
} from "../../modules/style/layout";
import { getTranslation, reservationsUrl } from "../../modules/util";
import { CenterSpinner } from "../../components/common/common";
import { BlackButton, Toast } from "../../styles/util";
import Sanitize from "../../components/common/Sanitize";
import { AccordionWithState as Accordion } from "../../components/common/Accordion";
import {
  canReservationTimeBeChanged,
  canUserCancelReservation,
  getNormalizedReservationOrderStatus,
  getReservationCancellationReason,
  getReservationValue,
} from "../../modules/reservation";
import { TERMS_OF_USE } from "../../modules/queries/reservationUnit";
import {
  getReservationUnitInstructionsKey,
  getReservationUnitName,
  getReservationUnitPrice,
} from "../../modules/reservationUnit";
import BreadcrumbWrapper from "../../components/common/BreadcrumbWrapper";
import ReservationStatus from "../../components/reservation/ReservationStatus";
import Address from "../../components/reservation-unit/Address";
import ReservationInfoCard from "../../components/reservation/ReservationInfoCard";
import ReservationOrderStatus from "../../components/reservation/ReservationOrderStatus";
import {
  reservationUnitPath,
  authEnabled,
  authenticationIssuer,
} from "../../modules/const";

type Props = {
  termsOfUse: Record<string, TermsOfUseType>;
  id: number;
};

export const getServerSideProps: GetServerSideProps = async ({
  locale,
  params,
}) => {
  const id = Number(params.id);

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
    const genericTerms = genericTermsData?.termsOfUse?.edges[0]?.node || {};

    return {
      props: {
        key: `${id}-${locale}`,
        ...(await serverSideTranslations(locale)),
        overrideBackgroundColor: "var(--tilavaraus-white)",
        termsOfUse: {
          genericTerms,
        },
        id,
      },
    };
  }

  return {
    notFound: true,
  };
};

const Spinner = styled(CenterSpinner)`
  margin: var(--spacing-layout-xl) auto;
`;

const StyledBreadcrumbWrapper = styled(BreadcrumbWrapper)`
  padding: 0;
`;

const Wrapper = styled.div`
  background-color: var(--color-white);
`;

const Container = styled(NarrowCenteredContainer)`
  padding: 0 var(--spacing-m) var(--spacing-layout-m);

  @media (min-width: ${breakpoints.m}) {
    max-width: 1000px;
    margin-bottom: var(--spacing-layout-l);
  }
`;

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

const Columns = styled.div`
  grid-template-columns: 1fr;
  display: grid;
  align-items: flex-start;
  gap: var(--spacing-l);

  @media (min-width: ${breakpoints.m}) {
    & > div:nth-of-type(1) {
      order: 2;
    }

    margin-top: var(--spacing-xl);
    grid-template-columns: 1fr 378px;
  }
`;

const Actions = styled.div`
  &:empty {
    display: none;
  }

  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
  margin: var(--spacing-m) 0 var(--spacing-m);

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
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-layout-m);
`;

const ReasonText = styled.div`
  color: var(--color-black-70);
  line-height: var(--lineheight-l);
`;

const SecondaryActions = styled.div`
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

const Reservation = ({ termsOfUse, id }: Props): JSX.Element => {
  const { t, i18n } = useTranslation();
  const session = useSession();

  const isUserUnauthenticated =
    authEnabled && session?.status === "unauthenticated";

  useEffect(() => {
    if (isUserUnauthenticated) {
      signIn(authenticationIssuer, {
        callbackUrl: window.location.href,
      });
    }
  }, [isUserUnauthenticated]);

  const [reservation, setReservation] = useState<ReservationType>(null);
  const [order, setOrder] = useState<PaymentOrderType>(null);

  const {
    data: reservationData,
    loading,
    error,
  } = useQuery<Query, QueryReservationByPkArgs>(GET_RESERVATION, {
    fetchPolicy: "no-cache",
    variables: {
      pk: id,
    },
  });

  const [getOrder, { loading: orderLoading }] = useLazyQuery<
    Query,
    QueryOrderArgs
  >(GET_ORDER, {
    fetchPolicy: "no-cache",
    onCompleted: (data) => {
      if (!data.order) {
        return;
      }
      setOrder(data.order);
    },
    onError: () => {},
  });

  useEffect(() => {
    if (reservationData?.reservationByPk) {
      setReservation(reservationData.reservationByPk);

      if (reservationData.reservationByPk.orderUuid) {
        getOrder({
          variables: {
            orderUuid: reservationData.reservationByPk.orderUuid,
          },
        });
      }
    }
  }, [reservationData, getOrder]);

  const reservationUnit = get(reservation?.reservationUnits, "0");

  const instructionsKey = useMemo(
    () => getReservationUnitInstructionsKey(reservation?.state),
    [reservation?.state]
  );

  const isReservationCancelled = reservation?.state === "CANCELLED";
  const isBeingHandled = reservation?.state === "REQUIRES_HANDLING";

  const shouldDisplayPricingTerms: boolean = useMemo(() => {
    if (!reservation || !reservationUnit) return false;

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

  const paymentTermsContent = useMemo(
    () => getTranslation(reservationUnit?.paymentTerms, "text"),
    [reservationUnit]
  );

  const cancellationTermsContent = useMemo(
    () => getTranslation(reservationUnit?.cancellationTerms, "text"),
    [reservationUnit]
  );

  const pricingTermsContent = useMemo(
    () => getTranslation(reservationUnit?.pricingTerms, "text"),
    [reservationUnit]
  );

  const serviceSpecificTermsContent = useMemo(
    () => getTranslation(reservationUnit?.serviceSpecificTerms, "text"),
    [reservationUnit]
  );

  const bylineContent = useMemo(() => {
    return (
      reservation && (
        <>
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
                onClick={() => router.push(reservation.calendarUrl)}
              >
                {t("reservations:saveToCalendar")}
              </BlackButton>
            )}
            {order?.receiptUrl &&
              ["PAID", "REFUNDED"].includes(order?.status) && (
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
        </>
      )
    );
  }, [
    reservation,
    reservationUnit,
    order?.receiptUrl,
    order?.status,
    t,
    i18n.language,
  ]);

  const [canTimeBeModified, modifyTimeReason] = useMemo(
    () => canReservationTimeBeChanged({ reservation }),
    [reservation]
  );

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

  if (isUserUnauthenticated) return null;

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

  const normalizedOrderStatus =
    getNormalizedReservationOrderStatus(reservation);

  if (loading || orderLoading) {
    return <Spinner />;
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
    reservationUnit.metadataSet?.supportedFields?.map(camelCase) || [];

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
          {getReservationValue(reservation, field) || "-"}
        </ParagraphAlt>
      )
  );

  const reserveeInfo = [
    ReservationsReservationReserveeTypeChoices.Business.toString(),
    ReservationsReservationReserveeTypeChoices.Nonprofit.toString(),
  ].includes(reservation.reserveeType) ? (
    <>
      {supportedFields.includes("reserveeOrganisationName") && (
        <ParagraphAlt>
          {t("reservations:organisationName")}:{" "}
          {reservation.reserveeOrganisationName || "-"}
        </ParagraphAlt>
      )}
      {supportedFields.includes("reserveeId") && (
        <ParagraphAlt>
          {t("reservations:reserveeId")}: {reservation.reserveeId || "-"}
        </ParagraphAlt>
      )}
      {(supportedFields.includes("reserveeFirstName") ||
        supportedFields.includes("reserveeLastName")) && (
        <ParagraphAlt>
          {t("reservations:contactName")}:{" "}
          {`${reservation.reserveeFirstName || ""} ${
            reservation.reserveeLastName || ""
          }`.trim()}
        </ParagraphAlt>
      )}
      {supportedFields.includes("reserveePhone") && (
        <ParagraphAlt>
          {t("reservations:contactPhone")}: {reservation.reserveePhone}
        </ParagraphAlt>
      )}
      {supportedFields.includes("reserveeEmail") && (
        <ParagraphAlt>
          {t("reservations:contactEmail")}: {reservation.reserveeEmail}
        </ParagraphAlt>
      )}
    </>
  ) : (
    <>
      {(supportedFields.includes("reserveeFirstName") ||
        supportedFields.includes("reserveeLastName")) && (
        <ParagraphAlt>
          {t("common:name")}:{" "}
          {`${reservation.reserveeFirstName || ""} ${
            reservation.reserveeLastName || ""
          }`.trim()}
        </ParagraphAlt>
      )}
      {supportedFields.includes("reserveePhone") && (
        <ParagraphAlt>
          {t("common:phone")}: {reservation.reserveePhone || "-"}
        </ParagraphAlt>
      )}
      {supportedFields.includes("reserveeEmail") && (
        <ParagraphAlt>
          {t("common:email")}: {reservation.reserveeEmail || "-"}
        </ParagraphAlt>
      )}
    </>
  );

  const isReservationCancellable =
    canUserCancelReservation(reservation) &&
    !isReservationCancelled &&
    !isBeingHandled;

  return (
    <Wrapper>
      <Container>
        <StyledBreadcrumbWrapper
          route={["", "/reservations", "reservationName"]}
          aliases={[
            {
              slug: "reservationName",
              title: t("reservations:reservationName", { id: reservation.pk }),
            },
          ]}
        />
        <Columns>
          <div>
            <JustForDesktop>{bylineContent}</JustForDesktop>
          </div>
          <div data-testid="reservation__content">
            <Heading>
              {t("reservations:reservationName", { id: reservation.pk })}
            </Heading>
            <SubHeading>
              <Link href={`${reservationUnitPath(reservationUnit.pk)}`}>
                {getReservationUnitName(reservationUnit)}
              </Link>
              <span>{timeString}</span>
            </SubHeading>
            <StatusContainer>
              <ReservationStatus state={reservation.state} />
              {normalizedOrderStatus && (
                <ReservationOrderStatus
                  orderStatus={normalizedOrderStatus}
                  data-testid="reservation__card--order-status-desktop"
                />
              )}
            </StatusContainer>
            <JustForMobile>{bylineContent}</JustForMobile>
            <Actions>
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
            <Content>
              {getTranslation(reservationUnit, instructionsKey) && (
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
                    {paymentTermsContent && (
                      <AccordionContent>
                        <Sanitize html={paymentTermsContent} />
                      </AccordionContent>
                    )}
                    <AccordionContent>
                      <Sanitize html={cancellationTermsContent} />
                    </AccordionContent>
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
                    <Sanitize
                      html={getTranslation(termsOfUse.genericTerms, "text")}
                    />
                  </AccordionContent>
                </Accordion>
              </Terms>
              <Address reservationUnit={reservationUnit} />
            </Content>
          </div>
        </Columns>
      </Container>
    </Wrapper>
  );
};

export default Reservation;
