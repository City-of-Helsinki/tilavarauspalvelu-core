import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, IconArrowRedo, Notification } from "hds-react";
import { getApplicationRound, triggerAllocation } from "../../common/api";
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
import { breakpoints, NotificationBox, Strong } from "../../styles/util";
import Heading from "./Heading";
import StatusRecommendation from "../Application/StatusRecommendation";
import withMainMenu from "../withMainMenu";
import ApplicationRoundNavi from "./ApplicationRoundNavi";
import TimeframeStatus from "./TimeframeStatus";
import AllocatingDialogContent from "./AllocatingDialogContent";

interface IProps {
  applicationRound: ApplicationRoundType;
  setApplicationRoundStatus: (status: ApplicationRoundStatus) => Promise<void>;
}

const Wrapper = styled.div`
  width: 100%;
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

function Allocation({
  applicationRound,
  setApplicationRoundStatus,
}: IProps): JSX.Element {
  const [isAllocating, setIsAllocating] = useState<boolean>(false);
  const [isAllocated, setIsAllocated] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();

  const startAllocation = async () => {
    if (!applicationRound) return;

    setErrorMsg(null);

    try {
      const allocation = await triggerAllocation({
        applicationRoundId: applicationRound.id,
        applicationRoundBasketIds: applicationRound.applicationRoundBaskets.map(
          (n) => n.id
        ),
      });
      setIsAllocating(!!allocation?.id);
    } catch (error) {
      const msg = "errors.errorStartingAllocation";
      setErrorMsg(msg);
    }
  };

  useEffect(() => {
    if (isAllocated) {
      setApplicationRoundStatus("allocated");
    }
  }, [isAllocated, setApplicationRoundStatus]);

  useEffect(() => {
    const poller = setInterval(async () => {
      if (isAllocating) {
        const result = await getApplicationRound({ id: applicationRound.id });
        setIsAllocated(!result.allocating);
      }
    }, 2000);

    return () => {
      clearInterval(poller);
    };
  }, [isAllocating, applicationRound]);

  return (
    <Wrapper>
      <Heading />
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
            <Button
              type="submit"
              variant="primary"
              onClick={() => startAllocation()}
              iconLeft={<IconArrowRedo />}
            >
              {t("ApplicationRound.allocateAction")}
            </Button>
            <div className="label">{t("ApplicationRound.allocateLabel")}</div>
          </div>
        </ActionContainer>
      </NarrowContainer>
      {isAllocating && <AllocatingDialogContent />}
      {errorMsg && (
        <Notification
          type="error"
          label={t("errors.functionFailed")}
          position="top-center"
          autoClose={false}
          dismissible
          closeButtonLabelText={t("common.close")}
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg(null)}
        >
          {t(errorMsg)}
        </Notification>
      )}
    </Wrapper>
  );
}

export default withMainMenu(Allocation);
