import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import styled from "styled-components";
import { Button, IconArrowRedo, Notification, Select } from "hds-react";
import { useHistory } from "react-router-dom";
import { getApplicationRound } from "../../common/api";
import Loader from "../Loader";
import {
  ApplicationRound as ApplicationRoundType,
  ApplicationRoundBasket,
  OptionType,
} from "../../common/types";
import { IngressContainer, NarrowContainer } from "../../styles/layout";
import { breakpoints } from "../../styles/util";
import Heading from "../Applications/Heading";
import StatusRecommendation from "../Applications/StatusRecommendation";
import withMainMenu from "../withMainMenu";
import ApplicationRoundNavi from "./ApplicationRoundNavi";
import TimeframeStatus from "./TimeframeStatus";
import { ContentHeading, H3, RequiredLabel } from "../../styles/typography";
import KorosHeading from "../KorosHeading";
import StatusCircle from "../StatusCircle";
import { ReactComponent as IconCustomers } from "../../images/icon_customers.svg";
import AllocatingDialogContent from "./AllocatingDialogContent";
import DataTable, { CellConfig } from "../DataTable";

interface IProps {
  applicationRoundId: string;
}

const Wrapper = styled.div`
  width: 100%;
`;

const StyledKorosHeading = styled(KorosHeading)`
  margin-bottom: var(--spacing-layout-l);
`;

const TopIngress = styled.div`
  & > div:last-of-type {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-top: var(--spacing-l);

    ${H3} {
      margin-left: var(--spacing-m);
      width: 50px;
      line-height: var(--lineheight-l);
    }
  }

  display: grid;

  ${ContentHeading} {
    width: 100%;
    padding: 0;
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1.8fr 1fr;
    grid-gap: var(--spacing-layout-m);
  }
`;

const Recommendation = styled.div`
  margin: var(--spacing-m) 0 0 0;
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
  margin-top: var(--spacing-l);

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
  button {
    margin-top: var(--spacing-s);
  }

  display: flex;
  justify-content: space-between;
  flex-direction: column-reverse;

  @media (min-width: ${breakpoints.l}) {
    flex-direction: row;
  }
`;

const getCellConfig = (t: TFunction): CellConfig => {
  console.log(t); // eslint-disable-line
  return {
    cols: [
      { title: "Application.headings.applicantName", key: "organisation.name" },
      {
        title: "Application.headings.purpose",
        key: "purpose",
      },
      {
        title: "Application.headings.ageGroup",
        key: "ageGroup",
      },
      {
        title: "Application.headings.applicationCount",
        key: "aggregatedData.reservationsTotal",
      },
      {
        title: "Application.headings.applicationStatus",
        key: "status",
      },
    ],
    index: "id",
    sorting: "organisation.name",
    order: "asc",
    rowLink: (id) => `/application/${id}`,
  };
};

function Handling({ applicationRoundId }: IProps): JSX.Element {
  // const basketOptions = applicationRound?.applicationRoundBaskets.map(
  //   (basket) => ({
  //     value: basket.value,
  //     label: basket.label,
  //   })
  // ) || [];
  const basketOptions = [
    {
      value: "1",
      label: "1. Helsinkiläiset lasten ja nuorten seurat",
    },
    { value: "2", label: "2. Muut helsinkiläiset seurat" },
    { value: "3", label: "3. Muut" },
  ];

  const [isLoading, setIsLoading] = useState(true);
  const [isAllocating, setIsAllocating] = useState(false);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [basket, setBasket] = useState<OptionType>(basketOptions[0]);
  const [cellConfig, setCellConfig] = useState<CellConfig | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();
  const history = useHistory();

  const startAllocation = (id: string, basketId: string): void => {
    console.log(id, basketId); // eslint-disable-line
    setIsAllocating(true);
  };

  const finishAllocation = (): void => {
    setIsAllocating(false);
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
        setCellConfig(getCellConfig(t));
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
  }, [applicationRoundId, t]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <Heading />
      {applicationRound && (
        <>
          <StyledKorosHeading
            heading={`n${t("common.volumeUnit")}`}
            subheading={t("ApplicationRound.suffixUnhandledSuggestions")}
          />
          <IngressContainer>
            <ApplicationRoundNavi applicationRoundId={applicationRoundId} />
            <TopIngress>
              <div>
                <ContentHeading>{applicationRound.name}</ContentHeading>
                <TimeframeStatus
                  applicationPeriodBegin={
                    applicationRound.applicationPeriodBegin
                  }
                  applicationPeriodEnd={applicationRound.applicationPeriodEnd}
                />
              </div>
              <div>
                <StatusCircle status={0} x={90} y={90} />
                <H3>{t("ApplicationRound.amountReserved")}</H3>
              </div>
            </TopIngress>
          </IngressContainer>
          <NarrowContainer style={{ marginBottom: "var(--spacing-4-xl)" }}>
            <Recommendation>
              <RecommendationLabel>
                {t("Application.recommendedStage")}:
              </RecommendationLabel>
              <RecommendationValue>
                <StatusRecommendation status="allocated" />
              </RecommendationValue>
            </Recommendation>
            <SelectWrapper>
              <Select
                id="allocatedBasket"
                label={t("ApplicationRound.allocatedBasket")}
                value={basket}
                onChange={(option: ApplicationRoundBasket) => setBasket(option)}
                options={basketOptions}
                icon={<IconCustomers />}
              />
            </SelectWrapper>
            <ActionContainer>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  history.push(
                    `/applicationRounds/${applicationRoundId}?approval`
                  )
                }
              >
                {t("ApplicationRound.navigateToApprovalPreparation")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!basket}
                onClick={() =>
                  startAllocation(applicationRoundId, basket.value)
                }
                iconLeft={<IconArrowRedo />}
              >
                {t("ApplicationRound.allocateAction")}
              </Button>
            </ActionContainer>
          </NarrowContainer>
          {cellConfig && (
            <DataTable data={[]} cellConfig={cellConfig} filterConfig={[]} />
          )}
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

export default withMainMenu(Handling);
