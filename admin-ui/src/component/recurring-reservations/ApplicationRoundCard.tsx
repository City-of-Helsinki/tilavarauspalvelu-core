import { Card, IconArrowRight } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { ApplicationRoundType } from "common/types/gql-types";
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
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;
const ServiceSector = styled.span``;
const Name = styled.span`
  font-size: var(--fontsize-heading-s);
  font-family: var(--font-medium);
  margin-bottom: 0.5rem;
`;
const Times = styled.div`
  display: flex;
  gap: var(--spacing-l);
  font-size: var(--fontsize-body-s);
  padding-bottom: var(--spacing-s);
`;

const Stats = styled.div`
  display: flex;
  gap: var(--spacing-m);
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
  justify-content: space-between;
  align-items: flex-end;
`;

const Number = styled.span`
  font-size: var(--fontsize-body-xl);
  font-weight: bold;
`;

const Label = styled.span`
  font-size: var(--fontsize-body-s);
`;

const StyledCard = styled(Card)`
  padding: var(--spacing-m);
  background: var(--color-black-5);
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
        <Container>
          <ServiceSector>
            {applicationRound.serviceSector?.nameFi}
          </ServiceSector>
          <Name>{applicationRound.nameFi}</Name>
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
          <Stats>
            <Stat
              value={applicationRound.reservationUnitCount as number}
              label={t("ApplicationRound.reservationUnitCount", {
                count: applicationRound.reservationUnitCount as number,
              })}
            />
            <Stat
              value={applicationRound.applicationsCount as number}
              label={t("ApplicationRound.applicationCount", {
                count: applicationRound.applicationsCount as number,
              })}
            />
          </Stats>
        </Container>
        <RightColumn>
          <ApplicationRoundStatusTag applicationRound={applicationRound} />
          <Link to={applicationRoundUrl(String(applicationRound.pk))}>
            <IconArrowRight size="l" style={{ color: "var(--color-black)" }} />
          </Link>
        </RightColumn>
      </Layout>
    </StyledCard>
  );
}

export default ApplicationRoundCard;
