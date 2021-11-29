import React from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import router from "next/router";
import { parseISO } from "date-fns";
import { isFinite } from "lodash";
import {
  Accordion,
  IconArrowLeft,
  IconCrossCircle,
  IconPen,
  Koros,
} from "hds-react";
import { Trans, useTranslation } from "react-i18next";
import { ReservationType } from "../../modules/gql-types";
import apolloClient from "../../modules/apolloClient";
import { GET_RESERVATION } from "../../modules/queries/reservation";
import { fontRegular, H1, H3, Strong } from "../../modules/style/typography";
import { NarrowCenteredContainer } from "../../modules/style/layout";
import { breakpoint } from "../../modules/style";
import Ticket from "../../components/reservation/Ticket";
import {
  capitalize,
  getTranslation,
  reservationsUrl,
} from "../../modules/util";
import { TwoColumnContainer } from "../../components/common/common";
import { MediumButton } from "../../styles/util";
import Sanitize from "../../components/common/Sanitize";
import { canUserCancelReservation } from "../../modules/reservation";

type Props = {
  reservation: ReservationType;
};

export const getServerSideProps: GetServerSideProps = async ({
  locale,
  params,
}) => {
  const id = Number(params.id);

  if (isFinite(id)) {
    const { data } = await apolloClient.query({
      query: GET_RESERVATION,
      variables: { pk: id },
    });

    if (data) {
      return {
        props: {
          ...(await serverSideTranslations(locale)),
          reservation: data.reservationByPk,
        },
      };
    }

    return {
      notFound: true,
    };
  }

  return {
    notFound: true,
  };
};

const Head = styled.div`
  padding: var(--spacing-layout-m) 0 0;
  background-color: var(--color-white);
`;

const HeadWrapper = styled(NarrowCenteredContainer)`
  padding: 0 var(--spacing-m);

  @media (min-width: ${breakpoint.m}) {
    max-width: 1000px;
  }
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

const StyledKoros = styled(Koros)`
  margin-top: var(--spacing-layout-xl);
  fill: var(--tilavaraus-gray);
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

const Paragraph = styled.p`
  white-space: pre-line;

  & > span {
    display: block;
  }
`;

const AccordionContainer = styled.div`
  @media (min-width: ${breakpoint.m}) {
    width: 70%;
  }

  line-height: var(--lineheight-l);

  button {
    margin-bottom: var(--spacing-xs);
  }
`;

const TermContainer = styled.div`
  margin-bottom: var(--spacing-xl);
  white-space: pre-line;

  div[role="heading"] {
    font-size: var(--fontsize-heading-s);
  }
`;

const Reservation = ({ reservation }: Props): JSX.Element => {
  const { t } = useTranslation();

  const reservationUnit = reservation.reservationUnits[0];

  const { begin, end } = reservation;

  const beginDate = t("common:dateWithWeekday", {
    date: begin && parseISO(begin),
  });

  const beginTime = t("common:timeWithPrefix", {
    date: begin && parseISO(begin),
  });

  const endDate = t("common:dateWithWeekday", {
    date: end && parseISO(end),
  });

  const endTime = t("common:time", {
    date: end && parseISO(end),
  });

  const isReservationCancelled = reservation.state === "CANCELLED";
  const ticketState = isReservationCancelled ? "error" : "complete";

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
              isFree
            />
            <div>
              <H1>
                {t(
                  `${
                    isReservationCancelled
                      ? "reservations:reservationCancelledTitle"
                      : "reservationCalendar:reservationInfo"
                  }`
                )}
              </H1>
              <Actions>
                <MediumButton
                  variant="secondary"
                  iconLeft={<IconPen />}
                  onClick={() => {}}
                  disabled
                  data-testid="reservation-detail__button--edit"
                >
                  {t("reservations:modifyReservation")}
                </MediumButton>
                <MediumButton
                  variant="secondary"
                  iconLeft={<IconCrossCircle />}
                  onClick={() =>
                    router.push(`${reservationsUrl}${reservation.pk}/cancel`)
                  }
                  disabled={
                    !canUserCancelReservation(reservation) ||
                    isReservationCancelled
                  }
                  data-testid="reservation-detail__button--cancel"
                >
                  {t("reservations:cancelReservation")}
                </MediumButton>
              </Actions>
            </div>
          </HeadColumns>
        </HeadWrapper>
        <StyledKoros className="koros" type="wave" />
      </Head>
      <BodyContainer>
        <H3>{t("reservationCalendar:reservationSummary")}</H3>
        <Paragraph>
          <Trans
            i18nKey="reservationUnit:reservationReminderText"
            t={t}
            values={{ user: reservation?.user }}
            components={{
              emailLink: (
                <a href={`mailto:${reservation?.user}`}>{reservation?.user}</a>
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
        <AccordionContainer>
          <TermContainer>
            <Accordion heading={t("reservations:reservationInfo")}>
              <Paragraph data-testid="reservation__detail--name">
                <Strong>{t("reservationCalendar:label.name")}</Strong>
                <span>{reservation.name}</span>
              </Paragraph>
              <Paragraph data-testid="reservation__detail--reserveeName">
                <Strong>{t("reservationCalendar:label.reserveeName")}</Strong>
                <span>
                  {`${reservation.reserveeFirstName || ""} ${
                    reservation.reserveeLastName || ""
                  }`.trim()}
                </span>
              </Paragraph>
              <Paragraph data-testid="reservation__detail--description">
                <Strong>{t("reservationCalendar:label.description")}</Strong>
                <span>{reservation.description}</span>
              </Paragraph>
              <Paragraph data-testid="reservation__detail--date">
                <Strong>
                  {t("reservationCalendar:label.reservationDate")}
                </Strong>
                <span>
                  {capitalize(
                    `${beginDate} ${beginTime} -${
                      endDate !== beginDate ? ` ${endDate}` : ""
                    } ${endTime}`
                  )}
                </span>
              </Paragraph>
              <Paragraph data-testid="reservation__detail--unit">
                <Strong>
                  {t("reservationCalendar:label.reservationSpace")}
                </Strong>
                <span>{getTranslation(reservationUnit, "name")}</span>
              </Paragraph>
              <Paragraph data-testid="reservation__detail--phone">
                <Strong>{t("common:phone")}</Strong>
                <span>{reservation.reserveePhone}</span>
              </Paragraph>
            </Accordion>
          </TermContainer>
        </AccordionContainer>
        <AccordionContainer>
          <TermContainer>
            <Accordion
              initiallyOpen={false}
              heading={t("reservationCalendar:heading.termsOfUse")}
            >
              <Sanitize html={getTranslation(reservationUnit, "termsOfUse")} />
            </Accordion>
          </TermContainer>
        </AccordionContainer>
        <AccordionContainer>
          <TermContainer>
            <Accordion
              initiallyOpen={false}
              heading={t("reservationCalendar:heading.resourceTerms")}
            >
              <Sanitize
                html={getTranslation(
                  reservationUnit.serviceSpecificTerms,
                  "text"
                )}
              />
            </Accordion>
          </TermContainer>
        </AccordionContainer>
        <MediumButton
          variant="secondary"
          onClick={() => router.push(reservationsUrl)}
          iconLeft={<IconArrowLeft />}
          data-testid="reservation-detail__button--return"
        >
          {t("reservations:backToReservations")}
        </MediumButton>
      </BodyContainer>
    </>
  );
};

export default Reservation;
