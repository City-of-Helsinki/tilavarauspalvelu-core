import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { IconArrowRight } from "hds-react";
import { ApplicationRound as ApplicationRoundType } from "../../common/types";
import { H2, H3 } from "../../styles/typography";
import { BasicLink, breakpoints } from "../../styles/util";
import ApplicationRoundStatusBlock from "./ApplicationRoundStatusBlock";
import TimeframeStatus from "./TimeframeStatus";

interface IProps {
  applicationRound: ApplicationRoundType;
  getRoute: (arg0: number) => string;
}

const Wrapper = styled.div`
  --border: 0.5rem solid var(--tilavaraus-admin-gray);

  &:first-of-type {
    &:last-of-type {
      border-bottom: var(--border);
    }

    border-bottom: none;
  }

  &:last-of-type {
    border-bottom: var(--border);
  }

  border: var(--border);
  border-bottom: 0;
  padding: var(--spacing-m) var(--spacing-l);
`;

const Top = styled.div`
  @media (min-width: ${breakpoints.l}) {
    display: flex;
    justify-content: space-between;
  }
`;

const Title = styled(H3)`
  font-size: var(--fontsize-heading-s);
  margin-top: 0;
  margin-bottom: var(--spacing-2-xs);

  @media (min-width: ${breakpoints.m}) {
    margin-right: var(--spacing-s);
  }
`;

const Subtitle = styled.div`
  margin-bottom: var(--spacing-xs);

  @media (min-width: ${breakpoints.m}) {
    margin-bottom: var(--spacing-l);
  }
`;

const Bottom = styled.div`
  & > *:last-of-type {
    align-self: flex-end;

    a {
      padding-bottom: 9px;
    }
  }

  @media (min-width: ${breakpoints.l}) {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-m);
  }
`;

const Details = styled.div`
  & > * {
    margin-bottom: var(--spacing-xs);
  }

  @media (min-width: ${breakpoints.m}) {
    display: grid;
    width: 60%;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-layout-xl);
  }
`;

const Value = styled(H2).attrs({ as: "div" })`
  display: inline-block;
  margin-bottom: var(--spacing-3-xs);

  @media (min-width: ${breakpoints.m}) {
    display: block;
  }
`;

const Label = styled.div`
  text-transform: lowercase;
  display: inline-block;
  margin-left: var(--spacing-2-xs);

  @media (min-width: ${breakpoints.m}) {
    display: block;
    margin: 0;
  }
`;

function ApplicationRoundCard({
  applicationRound,
  getRoute,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  const isApplicationRoundApproved = ["approved"].includes(
    applicationRound.status
  );

  return (
    <Wrapper>
      <Top>
        <div>
          <Title>{applicationRound.name}</Title>
          <Subtitle>{t("common.youthServices")}</Subtitle>
        </div>
        <ApplicationRoundStatusBlock applicationRound={applicationRound} />
      </Top>
      <Bottom>
        <Details>
          <TimeframeStatus
            applicationPeriodBegin={applicationRound.applicationPeriodBegin}
            applicationPeriodEnd={applicationRound.applicationPeriodEnd}
            isResolved={isApplicationRoundApproved}
            resolutionDate={applicationRound.statusTimestamp}
          />
          <div>
            <Value>{applicationRound.reservationUnitIds.length}</Value>
            <Label>{t("ApplicationRound.attachedReservationUnits")}</Label>
          </div>
        </Details>
        <div>
          <BasicLink to={getRoute(applicationRound.id)}>
            {t("common.inspect")} <IconArrowRight />
          </BasicLink>
        </div>
      </Bottom>
    </Wrapper>
  );
}

export default ApplicationRoundCard;
