import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { Button, Checkbox, ErrorSummary } from "hds-react";
import withMainMenu from "../../withMainMenu";
import Heading from "../Heading";
import { H1, H2 } from "../../../styles/typography";
import { breakpoints } from "../../../styles/util";
import { IngressContainer } from "../../../styles/layout";
import InfoBubble from "../../InfoBubble";
import DataTable, { CellConfig } from "../../DataTable";
import { useModal } from "../../../context/UIContext";
import { getApplicationRound, getApplications } from "../../../common/api";
import {
  Application,
  ApplicationRound as ApplicationRoundType,
} from "../../../common/types";
import TimeframeStatus from "../TimeframeStatus";
import Loader from "../../../common/Loader";
import LinkCell from "../../LinkCell";

interface IRouteParams {
  applicationRoundId: string;
}

const Wrapper = styled.div`
  width: 100%;
`;

const ApplicationNavi = styled.div`
  font-size: var(--fontsize-body-s);
  margin-top: var(--spacing-m);

  @media (min-width: ${breakpoints.l}) {
    display: flex;
    justify-content: flex-end;
  }
`;

const NaviItem = styled(Link)`
  &:first-of-type {
    margin-left: 0;
  }

  color: var(--tilavaraus-admin-content-text-color);
  text-decoration: none;
  margin-left: 2rem;
`;

const Content = styled.div``;

const ApplicationTitle = styled(H1)`
  @media (min-width: ${breakpoints.l}) {
    width: 60%;
  }

  padding-right: var(--spacing-l);
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

const StyledInfoBubble = styled(InfoBubble)`
  margin-left: var(--spacing-2-xs);
`;

const SubmitButton = styled(Button)`
  margin-bottom: var(--spacing-s);
`;

const ApplicationCount = styled(H2)`
  text-transform: lowercase;
`;

const StyledErrorSummary = styled(ErrorSummary)`
  margin: var(--spacing-l);
  width: 40%;
`;

function ApplicationRound(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isApplicationChecked, toggleIsApplicationChecked] = useState(false);

  const { applicationRoundId } = useParams<IRouteParams>();
  const { t } = useTranslation();
  const { setModalContent } = useModal();

  useEffect(() => {
    const fetchApplicationRound = async () => {
      setErrorMsg(null);
      setIsLoading(true);

      try {
        const result = await getApplicationRound({
          id: applicationRoundId,
        });
        setApplicationRound(result);
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

  useEffect(() => {
    const fetchApplications = async (applicationId: number) => {
      try {
        const result = await getApplications({
          applicationRound: applicationId,
        });
        setApplications(result);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplications");
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof applicationRound?.id === "number") {
      fetchApplications(applicationRound.id);
    }
  }, [applicationRound]);

  const exception = isLoading ? (
    <Loader />
  ) : (
    errorMsg && <StyledErrorSummary label={t(errorMsg)} />
  );

  const cellConfig: CellConfig = {
    cols: [
      { title: t("Application.headings.customer"), key: "organisation" },
      { title: t("Application.headings.participants"), key: "" },
      { title: t("Application.headings.customerType"), key: "" },
      { title: t("Application.headings.coreActivity"), key: "" },
      { title: t("Application.headings.applicationCount"), key: "" },
      {
        title: t("Application.headings.applicationStatus"),
        key: "status",
        transform: ({ id, status }: Application) => (
          <LinkCell
            status={status}
            text={t(`Application.statuses.${status}`)}
            link={`/application/${id}`}
          />
        ),
      },
    ],
    index: "id",
    sorting: "id",
    order: "asc",
  };

  return (
    <Wrapper>
      <Heading />
      {exception || (
        <>
          <IngressContainer>
            <ApplicationNavi>
              <NaviItem to="#">
                {t("Application.showAllApplications")} TODO
              </NaviItem>
              <NaviItem to="#">
                {t("Application.settingsAndQuotas")} TODO
              </NaviItem>
            </ApplicationNavi>
            <Content>
              <ApplicationTitle>{applicationRound?.name}</ApplicationTitle>
              <Details>
                <div>
                  <TimeframeStatus
                    applicationPeriodBegin={
                      applicationRound?.applicationPeriodBegin
                    }
                    applicationPeriodEnd={
                      applicationRound?.applicationPeriodEnd
                    }
                  />
                  <Recommendation>
                    <RecommendationLabel>
                      {t("Application.recommendedStage")}:
                    </RecommendationLabel>
                    <RecommendationValue>
                      TODO
                      <StyledInfoBubble
                        onClick={() =>
                          setModalContent &&
                          setModalContent(<div>modal content</div>)
                        }
                      />
                    </RecommendationValue>
                  </Recommendation>
                </div>
                <div>
                  <SubmitButton
                    disabled={!isApplicationChecked}
                    onClick={() => alert("TODO")}
                  >
                    {t("Application.gotoSplitPreparation")}
                  </SubmitButton>
                  <div>
                    <Checkbox
                      id="applicationsChecked"
                      checked={isApplicationChecked}
                      onClick={() =>
                        toggleIsApplicationChecked(!isApplicationChecked)
                      }
                      label={t("Application.iHaveCheckedApplications")}
                    />
                  </div>
                </div>
              </Details>
              <ApplicationCount>
                {applications.length}{" "}
                {t("Application.application", { count: applications.length })}
              </ApplicationCount>
            </Content>
          </IngressContainer>
          <DataTable data={applications} cellConfig={cellConfig} />
        </>
      )}
    </Wrapper>
  );
}

export default withMainMenu(ApplicationRound);
