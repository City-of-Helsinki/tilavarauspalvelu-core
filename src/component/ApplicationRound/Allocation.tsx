import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import { Button, IconArrowRedo, Notification } from "hds-react";
import { getApplicationRound } from "../../common/api";
import Loader from "../Loader";
import { ApplicationRound as ApplicationRoundType } from "../../common/types";
import { IngressContainer, NarrowContainer } from "../../styles/layout";
import { ContentHeading } from "../../styles/typography";
import { breakpoints, Strong } from "../../styles/util";
import Heading from "../Applications/Heading";
import StatusRecommendation from "../Applications/StatusRecommendation";
import withMainMenu from "../withMainMenu";
import ApplicationRoundNavi from "./ApplicationRoundNavi";
import TimeframeStatus from "./TimeframeStatus";
import AllocatingDialogContent from "./AllocatingDialogContent";

interface IProps {
  applicationRoundId: string;
}

const Wrapper = styled.div`
  width: 100%;
`;

const WideContainer = styled(IngressContainer)`
  padding-left: var(--spacing-m);
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

const NotificationBox = styled.div`
  background-color: var(--tilavaraus-admin-gray-darker);
  padding: 110px var(--spacing-layout-m) 100px;
  text-align: center;
  white-space: pre-line;
  line-height: var(--lineheight-xl);
  margin-bottom: var(--spacing-5-xl);
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

function Allocation({ applicationRoundId }: IProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [isAllocating, setIsAllocating] = useState(false);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();
  const history = useHistory();

  const startAllocation = (id: string): void => {
    console.log(id); // eslint-disable-line
    setIsAllocating(true);
  };

  const finishAllocation = (): void => {
    history.push(`/applicationRound/${applicationRoundId}?allocated`);
  };

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setErrorMsg(null);
      setIsLoading(true);

      try {
        const result = await getApplicationRound({
          id: applicationRoundId,
        });
        setApplicationRound(result);
        setIsLoading(false);
      } catch (error) {
        const msg =
          error.response?.status === 404
            ? "errors.applicationRoundNotFound"
            : "errors.errorFetchingData";
        setErrorMsg(msg);
        setIsLoading(false);
      }
    };

    fetchApplicationRound();
  }, [applicationRoundId]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <Heading />
      {applicationRound && (
        <>
          <IngressContainer>
            <ApplicationRoundNavi applicationRoundId={applicationRoundId} />
            <div>
              <ContentHeading>{applicationRound.name}</ContentHeading>
              <Details>
                <div>
                  <TimeframeStatus
                    applicationPeriodBegin={
                      applicationRound.applicationPeriodBegin
                    }
                    applicationPeriodEnd={applicationRound.applicationPeriodEnd}
                  />
                  <Recommendation>
                    <RecommendationLabel>
                      {t("Application.recommendedStage")}:
                    </RecommendationLabel>
                    <RecommendationValue>
                      <StatusRecommendation status="review_done" />
                    </RecommendationValue>
                  </Recommendation>
                </div>
              </Details>
            </div>
          </IngressContainer>
          <WideContainer>
            <NotificationBox>
              <Strong>
                {t("ApplicationRound.allocationNotificationHeading")}
              </Strong>
              <p>{t("ApplicationRound.allocationNotificationBody")}</p>
            </NotificationBox>
          </WideContainer>
          <NarrowContainer>
            <ActionContainer>
              <div className="box">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    history.push(`/applicationRound/${applicationRoundId}`)
                  }
                >
                  {t("ApplicationRound.navigateBackToReview")}
                </Button>
              </div>
              <div className="box">
                <Button
                  type="submit"
                  variant="primary"
                  onClick={() => startAllocation(applicationRoundId)}
                  iconLeft={<IconArrowRedo />}
                >
                  {t("ApplicationRound.allocateAction")}
                </Button>
                <div className="label">
                  {t("ApplicationRound.allocateLabel")}
                </div>
              </div>
            </ActionContainer>
          </NarrowContainer>
        </>
      )}
      {isAllocating && <AllocatingDialogContent callback={finishAllocation} />}
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
