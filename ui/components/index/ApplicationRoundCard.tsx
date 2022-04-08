import React, { useMemo } from "react";
import { Container, IconArrowRight } from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import Link from "next/link";
import styled from "styled-components";
import { parseISO } from "date-fns";
import Card from "../common/Card";
import {
  applicationRoundState,
  getTranslation,
  searchUrl,
} from "../../modules/util";
import { breakpoint } from "../../modules/style";
import { MediumButton } from "../../styles/util";
import { fontMedium, H4 } from "../../modules/style/typography";
import { ApplicationRoundType } from "../../modules/gql-types";

interface Props {
  applicationRound: ApplicationRoundType;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledCard = styled(Card)`
  && {
    --background-color: var(--color-black-8);
    --border-color: var(--color-black-8);
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-gap: var(--spacing-m);
    align-items: start;
    padding: var(--spacing-m);
    margin-bottom: var(--spacing-m);

    @media (max-width: ${breakpoint.s}) {
      grid-template-columns: 1fr;
    }
  }
`;

const StyledContainer = styled(Container)`
  line-height: var(--lineheight-l);
  max-width: 100%;
`;

const Name = styled(H4)`
  margin-top: 0;
  margin-bottom: var(--spacing-2-xs);
`;

const CardButton = styled(MediumButton)`
  width: max-content;

  @media (min-width: ${breakpoint.s}) {
    justify-self: right;
  }
`;

const StyledLink = styled.a`
  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);
  margin-top: var(--spacing-s);
  ${fontMedium};

  && {
    color: var(--color-bus);
  }

  @media (min-width: ${breakpoint.s}) {
    margin-top: var(--spacing-l);
    margin-bottom: var(--spacing-s);
  }
`;

const ApplicationRoundCard = ({ applicationRound }: Props): JSX.Element => {
  const { t } = useTranslation();

  const history = useRouter();

  const state = applicationRoundState(
    applicationRound.applicationPeriodBegin,
    applicationRound.applicationPeriodEnd
  );

  const name = useMemo(
    () => getTranslation(applicationRound, "name"),
    [applicationRound]
  );

  return (
    <StyledCard aria-label={name} border>
      <StyledContainer>
        <Name>{name}</Name>
        <div>
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
        </div>
        {state !== "past" && (
          <Link href={`/criteria/${applicationRound.pk}`} passHref>
            <StyledLink>
              <IconArrowRight />
              {t("applicationRound:card.criteria")}
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
