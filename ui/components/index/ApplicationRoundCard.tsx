import React, { useMemo } from "react";
import { Container, IconArrowRight } from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import Link from "next/link";
import styled from "styled-components";
import { parseISO } from "date-fns";
import { breakpoints } from "common/src/common/style";
import { fontMedium, H4 } from "common/src/common/typography";
import Card from "../common/Card";
import { applicationRoundState, searchUrl } from "../../modules/util";
import { MediumButton } from "../../styles/util";
import { ApplicationRoundType } from "../../modules/gql-types";
import { getApplicationRoundName } from "../../modules/applicationRound";

interface Props {
  applicationRound: ApplicationRoundType;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledCard = styled(Card)`
  && {
    --background-color: var(--color-black-8);
    --border-color: var(--color-black-8);
    display: grid;
    grid-template-columns: 1fr;
    grid-gap: var(--spacing-m);
    align-items: start;
    padding: var(--spacing-s);
    margin-bottom: var(--spacing-m);

    @media (min-width: ${breakpoints.s}) {
      grid-template-columns: 1fr auto;
    }
  }
`;

const StyledContainer = styled(Container)`
  line-height: var(--lineheight-l);
  max-width: 100%;
`;

const Name = styled(H4).attrs({ as: "h3" })`
  && {
    margin-top: 0;
    margin-bottom: 0;
  }
`;

const ReservationPeriod = styled.div`
  margin-top: var(--spacing-xs);
  @media (min-width: ${breakpoints.s}) {
    margin-top: 0;
  }
`;

const StatusMessage = styled.div`
  margin-top: var(--spacing-s);
`;

const CardButton = styled(MediumButton)`
  width: 100%;
  align-self: flex-end;

  @media (min-width: ${breakpoints.s}) {
    justify-self: right;
    width: max-content;
  }
`;

const StyledLink = styled.a`
  display: flex;
  align-items: center;
  gap: var(--spacing-3-xs);
  margin-top: var(--spacing-s);
  margin-bottom: var(--spacing-3-xs);
  text-decoration: underline;
  ${fontMedium};

  && {
    color: var(--color-black);
  }
`;

const ApplicationRoundCard = ({ applicationRound }: Props): JSX.Element => {
  const { t } = useTranslation();

  const history = useRouter();

  const state = applicationRoundState(
    applicationRound.applicationPeriodBegin,
    applicationRound.applicationPeriodEnd
  );

  const name = getApplicationRoundName(applicationRound);

  const reservationPeriod = useMemo(
    () =>
      t(`applicationRound:card.reservationPeriod`, {
        reservationPeriodBegin: new Date(
          applicationRound.reservationPeriodBegin
        ),
        reservationPeriodEnd: new Date(applicationRound.reservationPeriodEnd),
      }),
    [applicationRound, t]
  );

  return (
    <StyledCard aria-label={name} border>
      <StyledContainer>
        <Name>{name}</Name>
        {["active", "pending"].includes(state) && (
          <ReservationPeriod>{reservationPeriod}</ReservationPeriod>
        )}
        <StatusMessage>
          {state === "pending" &&
            t("applicationRound:card.pending", {
              openingDateTime: t("common:dateTime", {
                date: parseISO(applicationRound.applicationPeriodBegin),
              }),
            })}
          {state === "active" &&
            t("applicationRound:card.open", {
              until: parseISO(applicationRound.applicationPeriodEnd),
            })}
          {state === "past" &&
            t("applicationRound:card.past", {
              closingDate: parseISO(applicationRound.applicationPeriodEnd),
            })}
        </StatusMessage>
        {state !== "past" && (
          <Link href={`/criteria/${applicationRound.pk}`} passHref>
            <StyledLink>
              {t("applicationRound:card.criteria")}
              <IconArrowRight aria-hidden="true" />
            </StyledLink>
          </Link>
        )}
      </StyledContainer>
      {state === "active" && (
        <CardButton
          onClick={() =>
            history.push(searchUrl({ applicationRound: applicationRound.pk }))
          }
        >
          {t("application:Intro.startNewApplication")}
        </CardButton>
      )}
    </StyledCard>
  );
};

export default ApplicationRoundCard;
