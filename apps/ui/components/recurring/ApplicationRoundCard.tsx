import React from "react";
import { Card, Container, IconArrowRight } from "hds-react";
import { TFunction, useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { H4 } from "common/src/common/typography";
import ClientOnly from "common/src/ClientOnly";
import {
  type ApplicationRoundFieldsFragment,
  ApplicationRoundStatusChoice,
} from "@gql/gql-types";
import { IconButton } from "common/src/components";
import { formatDateTime, searchUrl } from "@/modules/util";
import { MediumButton } from "@/styles/util";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { isValid } from "date-fns";

interface Props {
  applicationRound: ApplicationRoundFieldsFragment;
}

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

const StyledLink = styled(IconButton)`
  color: var(--color-black);
`;

function translateRoundDate(
  t: TFunction,
  round: ApplicationRoundFieldsFragment
) {
  const begin = new Date(round.applicationPeriodBegin);
  const end = new Date(round.applicationPeriodEnd);
  if (!isValid(begin) || !isValid(end)) {
    // eslint-disable-next-line no-console
    console.warn("Invalid application period dates");
    return "";
  }

  switch (round.status) {
    case ApplicationRoundStatusChoice.Upcoming:
      return t("applicationRound:card.pending", {
        opening: formatDateTime(t, begin),
      });
    case ApplicationRoundStatusChoice.Open:
      return t("applicationRound:card.open", { until: formatDateTime(t, end) });
    default:
      // TODO no time here
      return t("applicationRound:card.past", {
        closing: formatDateTime(t, end),
      });
  }
}

const ApplicationRoundCard = ({ applicationRound }: Props): JSX.Element => {
  const { t } = useTranslation();

  const history = useRouter();

  const state = applicationRound.status;
  if (state == null) {
    // eslint-disable-next-line no-console
    console.warn("Application round status is null");
  }

  const name = getApplicationRoundName(applicationRound);

  const reservationPeriod = t(`applicationRound:card.reservationPeriod`, {
    // TODO check if time is needed
    reservationPeriodBegin: formatDateTime(
      t,
      new Date(applicationRound.reservationPeriodBegin)
    ),
    reservationPeriodEnd: formatDateTime(
      t,
      new Date(applicationRound.reservationPeriodEnd)
    ),
  });

  const timeString = translateRoundDate(t, applicationRound);

  return (
    <StyledCard aria-label={name} border>
      <StyledContainer>
        <Name>{name}</Name>
        {(state === ApplicationRoundStatusChoice.Open ||
          state === ApplicationRoundStatusChoice.Upcoming) && (
          <ReservationPeriod>{reservationPeriod}</ReservationPeriod>
        )}
        <StatusMessage>{timeString}</StatusMessage>
        <StyledLink
          href={`/criteria/${applicationRound.pk}`}
          label={t("applicationRound:card.criteria")}
          icon={<IconArrowRight aria-hidden />}
        />
      </StyledContainer>
      {state === ApplicationRoundStatusChoice.Open && (
        <CardButton
          onClick={() => {
            if (applicationRound.pk) {
              history.push(
                searchUrl({ applicationRound: applicationRound.pk })
              );
            }
          }}
        >
          {t("application:Intro.startNewApplication")}
        </CardButton>
      )}
    </StyledCard>
  );
};

// Hack to deal with hydration errors
export default ({ applicationRound }: Props): JSX.Element => (
  <ClientOnly>
    <ApplicationRoundCard applicationRound={applicationRound} />
  </ClientOnly>
);
