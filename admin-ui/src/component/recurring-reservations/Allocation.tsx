import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button } from "hds-react";
import { Strong } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  ApplicationRound as ApplicationRoundType,
  ApplicationRoundStatus,
} from "../../common/types";
import {
  IngressContainer,
  NarrowContainer,
  WideContainer,
} from "../../styles/layout";
import { ContentHeading } from "../../styles/typography";
import { NotificationBox } from "../../styles/util";
import StatusRecommendation from "../applications/StatusRecommendation";
import ApplicationRoundNavi from "./ApplicationRoundNavi";
import TimeframeStatus from "./TimeframeStatus";
import BreadcrumbWrapper from "../BreadcrumbWrapper";

type IProps = {
  applicationRound: ApplicationRoundType;
  setApplicationRoundStatus: (status: ApplicationRoundStatus) => Promise<void>;
};

const Wrapper = styled.div`
  width: 100%;
  margin-bottom: var(--spacing-layout-xl);
`;

const Details = styled.div`
  & > div {
    margin-bottom: var(--spacing-3-xl);
  }

  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-s);

  @media (min-width: ${breakpoints.l}) {
    & > div {
      &:nth-of-type(even) {
        justify-self: end;
      }
    }

    grid-template-columns: 1fr 1fr;
  }
`;

const Recommendation = styled.div`
  margin: var(--spacing-m) 0 0 var(--spacing-xl);
`;

const RecommendationLabel = styled.label`
  font-family: var(--tilavaraus-admin-font-bold);
  font-size: 1.375rem;
  font-weight: bold;
`;

const RecommendationValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: var(--spacing-3-xs);
`;

const ActionContainer = styled.div`
  .box:last-of-type {
    margin-top: var(--spacing-m);
  }

  display: flex;
  flex-direction: column-reverse;

  button {
    width: 100%;
  }

  .label {
    line-height: var(--lineheight-l);
    color: var(--color-black-60);
    margin-top: var(--spacing-s);
    margin-bottom: var(--spacing-l);
  }

  @media (min-width: ${breakpoints.l}) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: var(--spacing-layout-m);
    margin-top: var(--spacing-l);

    button {
      width: auto;
    }

    .box:last-of-type {
      text-align: right;
      margin: 0;
    }
  }
`;

const Allocation = ({
  applicationRound,
  setApplicationRoundStatus,
}: IProps) => {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <BreadcrumbWrapper
        route={[
          "recurring-reservations",
          "/recurring-reservations/application-rounds",
          "application-round",
        ]}
        aliases={[{ slug: "application-round", title: applicationRound.name }]}
      />
      <IngressContainer>
        <ApplicationRoundNavi applicationRoundId={applicationRound.id} />
        <div>
          <ContentHeading>{applicationRound.name}</ContentHeading>
          <Details>
            <div>
              <TimeframeStatus
                applicationPeriodBegin={applicationRound.applicationPeriodBegin}
                applicationPeriodEnd={applicationRound.applicationPeriodEnd}
              />
              <Recommendation>
                <RecommendationLabel>
                  {t("Application.recommendedStage")}:
                </RecommendationLabel>
                <RecommendationValue>
                  <StatusRecommendation
                    status="review_done"
                    applicationRound={applicationRound}
                  />
                </RecommendationValue>
              </Recommendation>
            </div>
          </Details>
        </div>
      </IngressContainer>
      <WideContainer>
        <NotificationBox>
          <Strong>{t("ApplicationRound.allocationNotificationHeading")}</Strong>
          <p>{t("ApplicationRound.allocationNotificationBody")}</p>
        </NotificationBox>
      </WideContainer>
      <NarrowContainer>
        <ActionContainer>
          <div className="box">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setApplicationRoundStatus("in_review");
              }}
            >
              {t("ApplicationRound.navigateBackToReview")}
            </Button>
          </div>
          <div className="box">
            <div className="label">{t("ApplicationRound.allocateLabel")}</div>
          </div>
        </ActionContainer>
      </NarrowContainer>
    </Wrapper>
  );
};

export default Allocation;
