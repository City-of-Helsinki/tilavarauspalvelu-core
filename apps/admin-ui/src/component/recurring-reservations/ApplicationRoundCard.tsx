import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { Card, IconArrowRight } from "hds-react";
import { ApplicationRoundType } from "common/types/gql-types";
import { breakpoints } from "common/src/common/style";
import { applicationRoundUrl } from "../../common/urls";
import ApplicationRoundStatusTag from "./ApplicationRoundStatusTag";
import ReservationPeriod from "./ReservationPeriod";
import TimeframeStatus from "./TimeframeStatus";

interface IProps {
  applicationRound: ApplicationRoundType;
}

const Layout = styled.div`
  display: flex;
  justify-content: space-between;
  flex-flow: row wrap;
  position: relative;
  gap: var(--spacing-2-xs);
`;

const StatusTagContainer = styled.div`
  order: 4;
  @media (width > ${breakpoints.s}) {
    order: 1;
  }
`;

const TitleContainer = styled.div`
  width: 100%;
  @media (width > ${breakpoints.s}) {
    width: 80%;
  }
`;

const Name = styled.span`
  font-size: var(--fontsize-heading-s);
  font-family: var(--font-medium);
  margin-bottom: var(--spacing-2-xs);
  order: 1;
`;
const Times = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2-xs);
  font-size: var(--fontsize-body-s);
  padding-bottom: var(--spacing-s);
  order: 3;
  width: 100%;
  @media (width > ${breakpoints.s}) {
    flex-direction: row;
    gap: var(--spacing-l);
  }
`;

const BottomContainer = styled.div`
  display: flex;
  order: 5;
  width: 100%;
  align-items: center;
`;
const Stats = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2-xs);
  width: 100%;
  @media (width > ${breakpoints.s}) {
    flex-direction: row;
    gap: var(--spacing-m);
  }
`;

const Number = styled.span`
  font-size: var(--fontsize-body-xl);
  font-weight: bold;
`;

const Label = styled.span`
  font-size: var(--fontsize-body-s);
`;

// HDS and styled-components have incorrect load order
const StyledCard = styled(Card)`
  && {
    padding: var(--spacing-m);
    background: var(--color-black-5);
  }
`;

function Stat({ value, label }: { value: number; label: string }): JSX.Element {
  return (
    <div>
      <Number>{value}</Number>
      <Label> {label}</Label>
    </div>
  );
}

function ApplicationRoundCard({ applicationRound }: IProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <StyledCard>
      <Layout>
        <TitleContainer>
          <div>{applicationRound.serviceSector?.nameFi}</div>
          <Name>{applicationRound.nameFi}</Name>
        </TitleContainer>
        <Times>
          <TimeframeStatus
            applicationPeriodBegin={applicationRound.applicationPeriodBegin}
            applicationPeriodEnd={applicationRound.applicationPeriodEnd}
          />
          <ReservationPeriod
            reservationPeriodBegin={applicationRound.reservationPeriodBegin}
            reservationPeriodEnd={applicationRound.reservationPeriodEnd}
          />
        </Times>
        <StatusTagContainer>
          <ApplicationRoundStatusTag applicationRound={applicationRound} />
        </StatusTagContainer>
        <BottomContainer>
          <Stats>
            <Stat
              value={applicationRound.reservationUnitCount ?? 0}
              label={t("ApplicationRound.reservationUnitCount", {
                count: applicationRound.reservationUnitCount ?? 0,
              })}
            />
            <Stat
              value={applicationRound.applicationsCount ?? 0}
              label={t("ApplicationRound.applicationCount", {
                count: applicationRound.applicationsCount ?? 0,
              })}
            />
          </Stats>
          <Link to={applicationRoundUrl(String(applicationRound.pk))}>
            <IconArrowRight size="l" style={{ color: "var(--color-black)" }} />
          </Link>
        </BottomContainer>
      </Layout>
    </StyledCard>
  );
}

export default ApplicationRoundCard;
