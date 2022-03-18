import React, { useMemo, useState } from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import router from "next/router";
import { get, isFinite } from "lodash";
import { Accordion, IconArrowLeft, IconCrossCircle, IconPen } from "hds-react";
import { useQuery } from "@apollo/client";
import { Trans, useTranslation } from "react-i18next";
import {
  Query,
  QueryTermsOfUseArgs,
  ReservationType,
  TermsOfUseType,
} from "../../modules/gql-types";
import apolloClient from "../../modules/apolloClient";
import { GET_RESERVATION } from "../../modules/queries/reservation";
import {
  fontRegular,
  H1,
  H2,
  H3,
  Strong,
} from "../../modules/style/typography";
import { NarrowCenteredContainer } from "../../modules/style/layout";
import { breakpoint } from "../../modules/style";
import Ticket from "../../components/reservation/Ticket";
import { getTranslation, reservationsUrl } from "../../modules/util";
import {
  CenterSpinner,
  TwoColumnContainer,
} from "../../components/common/common";
import { MediumButton } from "../../styles/util";
import Sanitize from "../../components/common/Sanitize";
import {
  canUserCancelReservation,
  getReservationApplicationFields,
  ReserveeType,
} from "../../modules/reservation";
import { TERMS_OF_USE } from "../../modules/queries/reservationUnit";
import KorosDefault from "../../components/common/KorosDefault";

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
        overrideBackgroundColor: "var(--tilavaraus-gray)",
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

const Head = styled.div`
  padding: var(--spacing-layout-m) 0 0;
  background-color: var(--color-white);
`;

const HeadWrapper = styled(NarrowCenteredContainer)`
  padding: 0 var(--spacing-m) var(--spacing-layout-m);

  @media (min-width: ${breakpoint.m}) {
    max-width: 1000px;
    margin-bottom: var(--spacing-layout-l);
  }
`;

const Heading = styled(H1)`
  font-size: 1.75rem;
  font-family: var(--font-bold);
  font-weight: 700;
  margin-bottom: var(--spacing-m);
`;

const HeadColumns = styled(TwoColumnContainer)`
  margin-top: 0;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoint.m}) {
    & > div:nth-of-type(1) {
      order: 2;
    }

    gap: var(--spacing-layout-xl);
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoint.s}) {
    button {
      max-width: 300px;
    }
  }
`;

const StyledKoros = styled(KorosDefault)`
  margin-top: var(--spacing-layout-xl);
`;

const BodyContainer = styled(NarrowCenteredContainer)`
  background-color: var(-color-gray);
  padding-bottom: var(--spacing-layout-l);
  ${fontRegular};

  a {
    color: var(--color-bus);
  }

  @media (min-width: ${breakpoint.m}) {
    max-width: 791px;
    padding-right: 219px;
  }
`;

const ContentHeading = styled(H2)`
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-bold);
  font-weight: 700;
`;

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

const TermContainer = styled.div`
  margin-bottom: var(--spacing-xl);
  white-space: pre-line;

  div[role="heading"] {
    font-size: var(--fontsize-heading-s);
  }
`;

const AccordionContainer = styled.div`
  @media (min-width: ${breakpoint.m}) {
    width: 70%;
  }

  line-height: var(--lineheight-l);

  ${TermContainer} {
    margin-bottom: 0;
  }

  button {
    margin-bottom: var(--spacing-xs);
  }
`;

const ActionContainer = styled.div`
  margin-top: var(--spacing-2-xl);
`;

const Reservation = ({ termsOfUse, id }: Props): JSX.Element => {
  const { t } = useTranslation();

  const [reservation, setReservation] = useState<ReservationType>();

  useQuery(GET_RESERVATION, {
    fetchPolicy: "no-cache",
    variables: {
      pk: id,
    },
    onCompleted: (data) => {
      setReservation(data.reservationByPk);
    },
  });

  const reservationUnit = reservation?.reservationUnits[0];

  const isReservationCancelled = reservation?.state === "CANCELLED";
  const isBeingHandled = reservation?.state === "REQUIRES_HANDLING";
  const ticketState = useMemo(() => {
    if (isBeingHandled) {
      return "incomplete";
    }

    return isReservationCancelled ? "error" : "complete";
  }, [isBeingHandled, isReservationCancelled]);

  if (!reservation) {
    return <Spinner />;
  }

  const optionValues = {
    purpose: getTranslation(reservation.purpose, "name"),
    ageGroup: `${reservation.ageGroup?.minimum} - ${reservation.ageGroup?.maximum}`,
    homeCity: reservation.homeCity?.name,
  };

  const headingSlug = isReservationCancelled
    ? "reservations:reservationCancelledTitle"
    : isBeingHandled
    ? "reservationApplication:applicationInfo"
    : "reservationCalendar:reservationInfo";
  const subHeadingSlug = isBeingHandled
    ? "reservationApplication:applicationSummary"
    : "reservationCalendar:reservationSummary";

  const reserveeType =
    reservation.reserveeType && reservation.reserveeType.toLowerCase();

  return (
    <>
      <Head>
        <HeadWrapper>
          <HeadColumns>
            <Ticket
              state={ticketState}
              title={getTranslation(reservationUnit, "name")}
              subtitle={getTranslation(reservationUnit.unit, "name")}
              begin={reservation.begin}
              end={reservation.end}
              isFree={!reservation.price}
              reservationPrice={reservation.price}
            />
            <div>
              <Heading>{t(headingSlug)}</Heading>
              <Actions>
                <MediumButton
                  variant="secondary"
                  iconLeft={<IconPen />}
                  onClick={() => {}}
                  disabled
                  data-testid="reservation-detail__button--edit"
                >
                  {t(
                    `reservations:modify${
                      isBeingHandled ? "Application" : "Reservation"
                    }`
                  )}
                </MediumButton>
                <MediumButton
                  variant="secondary"
                  iconLeft={<IconCrossCircle />}
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
                </MediumButton>
              </Actions>
            </div>
          </HeadColumns>
        </HeadWrapper>
        <StyledKoros from="white" to="var(--tilavaraus-gray)" />
      </Head>
      <BodyContainer>
        <ContentHeading>{t(subHeadingSlug)}</ContentHeading>
        {isBeingHandled ? (
          <Paragraph>{t("reservationApplication:summaryIngress")}</Paragraph>
        ) : (
          <>
            <Paragraph>
              <Trans
                i18nKey="reservationUnit:reservationReminderText"
                t={t}
                values={{ user: reservation?.user }}
                components={{
                  emailLink: (
                    <a href={`mailto:${reservation?.user}`}>
                      {reservation?.user}
                    </a>
                  ),
                }}
              />
            </Paragraph>
            <Paragraph>
              <Trans
                i18nKey="reservationUnit:loadReservationCalendar"
                t={t}
                components={{
                  calendarLink: (
                    <a
                      href={reservation?.calendarUrl}
                      data-test="reservation__confirmation--calendar-url"
                    >
                      {" "}
                    </a>
                  ),
                }}
              />
            </Paragraph>
            <Paragraph>
              {t("common:thanksForUsingVaraamo")}
              <br />
              <a
                href={t(`footer:Navigation.feedback.href`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("common:sendFeedback")}
              </a>
            </Paragraph>
          </>
        )}
        {getTranslation(reservationUnit, "additionalInstructions") && (
          <TermContainer>
            <H3>{t("reservations:reservationInfo")}</H3>
            <Paragraph>
              {getTranslation(reservationUnit, "additionalInstructions")}
            </Paragraph>
          </TermContainer>
        )}
        <H3>{t("reservationUnit:additionalInfo")}</H3>
        <TermContainer>
          {reservation.reservationUnits[0]?.metadataSet?.supportedFields &&
          reserveeType ? (
            <>
              {getReservationApplicationFields(
                reservation.reservationUnits[0].metadataSet?.supportedFields,
                reserveeType as ReserveeType,
                true
              )
                .filter(
                  (key) =>
                    !["", undefined, false, 0, null].includes(
                      get(reservation, key)
                    )
                )
                .map((key) => {
                  const rawValue = get(reservation, key);
                  const value = get(optionValues, key)
                    ? get(optionValues, key)
                    : typeof rawValue === "boolean"
                    ? t(`common:${String(rawValue)}`)
                    : rawValue;
                  return (
                    <ParagraphAlt key={`summary_${key}`}>
                      <div>
                        <Strong>
                          {t(
                            `reservationApplication:label.${reserveeType}.${key}`
                          )}
                        </Strong>
                      </div>
                      <div>{value}</div>
                    </ParagraphAlt>
                  );
                })}
            </>
          ) : (
            <>
              <ParagraphAlt>
                <div>
                  <Strong>{t("reservationCalendar:label.reserveeName")}</Strong>
                </div>
                <div>
                  {`${reservation.reserveeFirstName || ""} ${
                    reservation.reserveeLastName || ""
                  }`.trim()}
                </div>
              </ParagraphAlt>
              <ParagraphAlt>
                <div>
                  <Strong>{t("common:phone")}</Strong>
                  <div>{reservation.reserveePhone}</div>
                </div>
              </ParagraphAlt>
              <ParagraphAlt style={{ gridColumn: "1 / -1" }}>
                <div>
                  <Strong>{t("reservationCalendar:label.name")}</Strong>
                </div>
                <div>{reservation.name}</div>
              </ParagraphAlt>
              <ParagraphAlt>
                <div>
                  <Strong>{t("reservationCalendar:label.description")}</Strong>
                </div>
                <div>{reservation.description}</div>
              </ParagraphAlt>
            </>
          )}
        </TermContainer>
        {getTranslation(reservationUnit, "termsOfUse") && (
          <AccordionContainer>
            <TermContainer>
              <Accordion
                initiallyOpen={false}
                heading={t("reservationCalendar:heading.termsOfUse")}
              >
                <Sanitize
                  html={getTranslation(termsOfUse?.genericTerms, "text")}
                />
              </Accordion>
            </TermContainer>
          </AccordionContainer>
        )}
        {getTranslation(reservationUnit.serviceSpecificTerms, "text") && (
          <AccordionContainer>
            <TermContainer>
              <Accordion
                initiallyOpen={false}
                heading={t("reservationCalendar:heading.resourceTerms")}
              >
                <p>
                  <Sanitize
                    html={getTranslation(reservationUnit, "termsOfUse")}
                  />
                </p>
                <p>
                  <Sanitize
                    html={getTranslation(
                      reservationUnit.serviceSpecificTerms,
                      "text"
                    )}
                  />
                </p>
              </Accordion>
            </TermContainer>
          </AccordionContainer>
        )}
        <ActionContainer>
          <MediumButton
            variant="secondary"
            onClick={() => router.push(reservationsUrl)}
            iconLeft={<IconArrowLeft />}
            data-testid="reservation-detail__button--return"
          >
            {t("common:prev")}
          </MediumButton>
        </ActionContainer>
      </BodyContainer>
    </>
  );
};

export default Reservation;
