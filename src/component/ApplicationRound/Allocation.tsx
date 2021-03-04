import { Button, IconArrowRedo, Notification, Select } from "hds-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import { getApplicationRound } from "../../common/api";
import Loader from "../../common/Loader";
import {
  ApplicationRound as ApplicationRoundType,
  ApplicationRoundBasket,
} from "../../common/types";
import { IngressContainer, NarrowContainer } from "../../styles/layout";
import { ContentHeading, RequiredLabel } from "../../styles/typography";
import { breakpoints } from "../../styles/util";
import Heading from "../Applications/Heading";
import StatusRecommendation from "../Applications/StatusRecommendation";
import withMainMenu from "../withMainMenu";
import ApplicationRoundNavi from "./ApplicationRoundNavi";
import TimeframeStatus from "./TimeframeStatus";
import { ReactComponent as IconCustomers } from "../../images/icon_customers.svg";

interface IProps {
  applicationRoundId: string;
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

const SelectWrapper = styled.div`
  label[for="allocatedBasket-toggle-button"] {
    ${RequiredLabel}
    font-family: var(--tilavaraus-admin-font-medium);
    font-weight: 500;
  }

  #allocatedBasket-helper {
    line-height: var(--lineheight-l);
    margin-top: var(--spacing-xs);
  }
`;

const ActionContainer = styled.div`
  .box:last-of-type {
    margin-top: var(--spacing-m);
  }

  display: grid;
  grid-template-columns: 1fr;
  margin-top: var(--spacing-3-xl);

  .label {
    line-height: var(--lineheight-l);
    color: var(--color-black-60);
    margin-top: var(--spacing-s);
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr;
    grid-gap: var(--spacing-layout-m);

    .box:last-of-type {
      text-align: right;
      margin: 0;
    }
  }
`;

function Allocation({ applicationRoundId }: IProps): JSX.Element {
  // const basketOptions = applicationRound?.applicationRoundBaskets.map(
  //   (basket) => ({
  //     value: basket.value,
  //     label: basket.label,
  //   })
  // ) || [];
  const basketOptions = [
    {
      value: "1",
      label: "Helsinkiläiset lasten ja nuorten seurat",
    },
    { value: "2", label: "Muut helsinkiläiset seurat" },
    { value: "3", label: "Muut" },
  ];

  const [isLoading, setIsLoading] = useState(true);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [basket, setBasket] = useState<number | string | null>(
    basketOptions[0]?.value
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();
  const history = useHistory();

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
          <NarrowContainer>
            <SelectWrapper>
              <Select
                id="allocatedBasket"
                label={t("ApplicationRound.allocatedBasket")}
                onChange={(option: ApplicationRoundBasket) =>
                  setBasket(option.value)
                }
                helper={t("ApplicationRound.allocatedBasketHelper")}
                options={basketOptions}
                defaultValue={basketOptions[0]}
                icon={<IconCustomers />}
              />
            </SelectWrapper>
            <ActionContainer>
              <div className="box">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    history.push(`/applicationRounds/${applicationRoundId}`)
                  }
                >
                  {t("ApplicationRound.navigateBackToReview")}
                </Button>
              </div>
              <div className="box">
                <Button
                  type="submit"
                  variant="primary"
                  onClick={() => console.log(basket)}
                  iconLeft={<IconArrowRedo />}
                >
                  {t("ApplicationRound.allocateVerb")}
                </Button>
                <div className="label">
                  {t("ApplicationRound.allocateLabel")}
                </div>
              </div>
            </ActionContainer>
          </NarrowContainer>
        </>
      )}
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
