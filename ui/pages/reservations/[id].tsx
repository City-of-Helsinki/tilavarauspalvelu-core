import React, { useMemo } from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import router from "next/router";
import { isFinite } from "lodash";
import { IconCalendar, IconCross, Notification } from "hds-react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { H1, H4 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  Query,
  QueryReservationByPkArgs,
  QueryTermsOfUseArgs,
  ReservationsReservationReserveeTypeChoices,
  ReservationType,
  TermsOfUseType,
} from "../../modules/gql-types";
import apolloClient from "../../modules/apolloClient";
import { GET_RESERVATION } from "../../modules/queries/reservation";
import {
  JustForDesktop,
  JustForMobile,
  NarrowCenteredContainer,
} from "../../modules/style/layout";
import { getTranslation, reservationsUrl } from "../../modules/util";
import { CenterSpinner } from "../../components/common/common";
import { BlackButton } from "../../styles/util";
import Sanitize from "../../components/common/Sanitize";
import { AccordionWithState as Accordion } from "../../components/common/Accordion";
import {
  canUserCancelReservation,
  getReservationCancellationReason,
} from "../../modules/reservation";
import { TERMS_OF_USE } from "../../modules/queries/reservationUnit";
import {
  getReservationUnitInstructionsKey,
  getReservationUnitName,
} from "../../modules/reservationUnit";
import BreadcrumbWrapper from "../../components/common/BreadcrumbWrapper";
import ReservationStatus from "../../components/reservation/ReservationStatus";
import Address from "../../components/reservation-unit/Address";
import ReservationInfoCard from "../../components/reservation/ReservationInfoCard";

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
        termsType: "generic_terms",
      },
    });
    const genericTerms = genericTermsData?.termsOfUse?.edges[0]?.node || {};

    return {
      props: {
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

const Heading = styled(H1)`
  margin-top: 0;
  margin-bottom: var(--spacing-m);
`;

const SubHeading = styled(H4).attrs({ as: "h2" })`
  margin-top: 0;
  margin-bottom: var(--spacing-m);
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
  display: flex;
  gap: var(--spacing-m);
  margin: var(--spacing-s) 0 var(--spacing-xl);

  @media (min-width: ${breakpoints.s}) {
    button {
      max-width: 300px;
    }
  }
`;

const CancellationText = styled.div`
  color: var(--color-black-70);
  line-height: var(--lineheight-l);
`;

const SecondaryActions = styled.div`
  margin-top: var(--spacing-l);
  display: flex;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    justify-content: flex-end;
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
  const { t } = useTranslation();

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

  const reservation: ReservationType = useMemo(
    () => reservationData?.reservationByPk,
    [reservationData]
  );

  const reservationUnit = reservation?.reservationUnits[0];

  const instructionsKey = useMemo(
    () => getReservationUnitInstructionsKey(reservation?.state),
    [reservation?.state]
  );

  const isReservationCancelled = reservation?.state === "CANCELLED";
  const isBeingHandled = reservation?.state === "REQUIRES_HANDLING";

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
          />
          <SecondaryActions>
            <Link href={reservation.calendarUrl} passHref>
              <BlackButton
                variant="secondary"
                iconRight={<IconCalendar aria-hidden />}
                disabled={!reservation.calendarUrl}
                data-testid="reservation__button--calendar-link"
              >
                {t("reservations:saveToCalendar")}
              </BlackButton>
            </Link>
          </SecondaryActions>
        </>
      )
    );
  }, [reservation, reservationUnit, t]);

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

  if (error) {
    return (
      <Notification
        type="error"
        label={t("common:error")}
        position="top-center"
        autoClose={false}
        displayAutoCloseProgress={false}
      >
        {t("common:dataError")}
      </Notification>
    );
  }

  return loading || !reservation ? (
    <Spinner />
  ) : (
    <Wrapper>
      <Container>
        <StyledBreadcrumbWrapper
          route={[
            "",
            "/reservations",
            t("reservations:reservationName", { id: reservation.pk }),
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
            <SubHeading>{getReservationUnitName(reservationUnit)}</SubHeading>
            <ReservationStatus state={reservation.state} />
            <JustForMobile>{bylineContent}</JustForMobile>
            <Actions>
              {canUserCancelReservation(reservation) &&
              !isReservationCancelled &&
              !isBeingHandled ? (
                <BlackButton
                  variant="secondary"
                  iconRight={<IconCross />}
                  onClick={() =>
                    router.push(`${reservationsUrl}${reservation.pk}/cancel`)
                  }
                  disabled={
                    !canUserCancelReservation(reservation) ||
                    isReservationCancelled ||
                    isBeingHandled
                  }
                  data-testid="reservation-detail__button--cancel"
                >
                  {t(
                    `reservations:cancel${
                      isBeingHandled ? "Application" : "Reservation"
                    }`
                  )}
                </BlackButton>
              ) : (
                cancellationReason && (
                  <CancellationText>
                    {t(
                      `reservations:cancellationReasons:${cancellationReason}`
                    )}
                  </CancellationText>
                )
              )}
            </Actions>
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
                {t("reservationCalendar:reserverInfo")}
              </ParagraphHeading>
              <ContentContainer>
                {[
                  ReservationsReservationReserveeTypeChoices.Business.toString(),
                  ReservationsReservationReserveeTypeChoices.Nonprofit.toString(),
                ].includes(reservation.type) ? (
                  <>
                    {reservation.reserveeOrganisationName && (
                      <ParagraphAlt>
                        {t("reservations:organisationName")}:{" "}
                        {reservation.reserveeOrganisationName}
                      </ParagraphAlt>
                    )}
                    {reservation.reserveeId && (
                      <ParagraphAlt>
                        {t("reservations:reserveeId")}: {reservation.reserveeId}
                      </ParagraphAlt>
                    )}
                    {reservation.reserveeId && (
                      <ParagraphAlt>
                        {t("reservations:reserveeId")}: {reservation.reserveeId}
                      </ParagraphAlt>
                    )}
                    <ParagraphAlt>
                      {t("reservations:contactName")}:{" "}
                      {`${reservation.reserveeFirstName || ""} ${
                        reservation.reserveeLastName || ""
                      }`.trim()}
                    </ParagraphAlt>
                    {reservation.reserveePhone && (
                      <ParagraphAlt>
                        {t("reservations:contactPhone")}:{" "}
                        {reservation.reserveePhone}
                      </ParagraphAlt>
                    )}
                    {reservation.reserveeEmail && (
                      <ParagraphAlt>
                        {t("reservations:contactEmail")}:{" "}
                        {reservation.reserveeEmail}
                      </ParagraphAlt>
                    )}
                  </>
                ) : (
                  <>
                    <ParagraphAlt>
                      {t("common:name")}:{" "}
                      {`${reservation.reserveeFirstName || ""} ${
                        reservation.reserveeLastName || ""
                      }`.trim()}
                    </ParagraphAlt>
                    {reservation.reserveePhone && (
                      <ParagraphAlt>
                        {t("common:phone")}: {reservation.reserveePhone}
                      </ParagraphAlt>
                    )}
                    {reservation.reserveeEmail && (
                      <ParagraphAlt>
                        {t("common:email")}: {reservation.reserveeEmail}
                      </ParagraphAlt>
                    )}
                  </>
                )}
              </ContentContainer>
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
                {pricingTermsContent && (
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
