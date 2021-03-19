import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import trim from "lodash/trim";
import {
  Button,
  IconArrowRight,
  IconCheckCircle,
  IconCrossCircle,
  Notification,
} from "hds-react";
import { getApplication, getApplicationRound } from "../../common/api";
import {
  Application as ApplicationType,
  ApplicationRound as ApplicationRoundType,
} from "../../common/types";
import { formatNumber, parseDuration } from "../../common/util";
import {
  ContentContainer,
  IngressContainer,
  NarrowContainer,
} from "../../styles/layout";
import { H1, H2 } from "../../styles/typography";
import {
  BasicLink,
  breakpoints,
  Divider,
  PlainButton,
  Strong,
} from "../../styles/util";
import LinkPrev from "../LinkPrev";
import Loader from "../Loader";
import StatusBlock from "../StatusBlock";
import withMainMenu from "../withMainMenu";
import ApplicantBox from "./ApplicantBox";
import RecommendedSlot from "./RecommendedSlot";
import { ReactComponent as IconInformation } from "../../images/icon_information.svg";

interface IRouteParams {
  applicationRoundId: string;
  recommendationId: string;
}

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-xl);
`;

const Top = styled.div`
  & > div {
    &:nth-of-type(even) {
      padding-right: var(--spacing-3-xl);
    }
  }

  display: grid;

  @media (min-width: ${breakpoints.l}) {
    & > div {
      &:nth-of-type(even) {
        max-width: 400px;
        justify-self: right;
      }
    }

    grid-template-columns: 1fr 1fr;
    grid-gap: var(--spacing-l);
  }
`;

const LinkToOthers = styled(BasicLink)`
  text-decoration: none;
  display: block;
  margin-bottom: var(--spacing-xs);
`;

const Heading = styled(H1)`
  margin-bottom: var(--spacing-3-xs);
`;

const StyledStatusBlock = styled(StatusBlock)`
  margin-top: var(--spacing-xl);
`;

const Subheading = styled(H2)`
  font-size: 2rem;
`;

const Props = styled.div`
  display: table;
  font-size: var(--fontsize-heading-xs);
  line-height: 2.6rem;
`;
const PropRow = styled.div`
  display: table-row;
`;
const Label = styled.div`
  display: table-cell;
  padding-right: var(--spacing-3-xl);
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: 700;
`;
const Value = styled.div`
  display: table-cell;
`;

const Recommendations = styled.div`
  overflow-x: auto;
`;

const Terms = styled.div`
  margin-bottom: var(--spacing-layout-2-xl);
`;

const TermButton = styled(PlainButton)`
  margin-right: var(--spacing-s);
`;

const ActionContainer = styled.div`
  button {
    margin: 0 var(--spacing-m) var(--spacing-xs) 0;
  }

  display: flex;
  justify-content: space-between;
  flex-direction: column-reverse;

  @media (min-width: ${breakpoints.l}) {
    flex-direction: row;
  }
`;

// TODO: clean up route
function Recommendation(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [application, setApplication] = useState<ApplicationType | null>(null);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();
  const { applicationRoundId, recommendationId } = useParams<IRouteParams>();

  useEffect(() => {
    const fetchData = async (recId: number, appRoundId: string) => {
      try {
        const result = await getApplicationRound({
          id: appRoundId,
        });

        setRecommendation({ applicationId: recId });
        setApplicationRound(result);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplication");
        setIsLoading(false);
      }
    };

    fetchData(Number(recommendationId), applicationRoundId);
  }, [applicationRoundId, recommendationId]);

  useEffect(() => {
    const fetchApplication = async (id: number) => {
      try {
        const result = await getApplication(id);
        setApplication(result);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplication");
      } finally {
        setIsLoading(false);
      }
    };

    if (recommendation?.applicationId) {
      fetchApplication(Number(recommendation.applicationId));
    }
  }, [recommendation]);

  if (isLoading || !application) {
    return <Loader />;
  }

  return (
    <Wrapper>
      <ContentContainer>
        <LinkPrev route={`/applicationRound/${applicationRoundId}?allocated`} />
      </ContentContainer>
      <IngressContainer>
        <Top>
          <div>
            <LinkToOthers
              to={`/applicationRound/${applicationRoundId}/applicant/${application.id}`}
            >
              {t("Recommendation.linkToOtherRecommendations")} TODO
            </LinkToOthers>
            <div>
              {t("Application.applicationId")} <Strong>???????</Strong>{" "}
            </div>
            <Heading>Ehdotus, osa ??????</Heading>
            <div>{applicationRound?.name}</div>
            <StyledStatusBlock status="allocated" />
          </div>
          <div>{application && <ApplicantBox application={application} />}</div>
        </Top>
      </IngressContainer>
      <NarrowContainer>
        <Subheading>{t("Recommendation.summary")}</Subheading>
        <Props>
          <PropRow>
            <Label>{t("Application.headings.purpose")}</Label>
            <Value>???</Value>
          </PropRow>
          <PropRow>
            <Label>{t("Application.headings.ageGroup")}</Label>
            <Value>???</Value>
          </PropRow>
          <PropRow>
            <Label>{t("ApplicationRound.appliedReservations")}</Label>
            <Value>
              {trim(
                `${formatNumber(
                  application?.aggregatedData?.reservationsTotal,
                  t("common.volumeUnit")
                )} / ${parseDuration(
                  application?.aggregatedData?.minDurationTotal
                )}`,
                " / "
              )}
            </Value>
          </PropRow>
          <PropRow>
            <Label>{t("ApplicationRound.appliedSpace")}</Label>
            <Value>???</Value>
          </PropRow>
          <PropRow>
            <Label>{t("Organisation.extraInformation")}</Label>
            <Value>???</Value>
          </PropRow>
        </Props>
        <Divider />
        <H2 as="h3">{t("Recommendation.recommendedSlot")}</H2>
        <Recommendations>
          <table>
            <RecommendedSlot
              id={1}
              start="2021-01-01T00:00:00Z"
              end="2022-12-31T00:00:00Z"
              weekday={4}
              biweekly
              timeStart="8:00:00"
              timeEnd="9:00:00"
            />
            <RecommendedSlot
              id={1}
              start="2021-01-01T00:00:00Z"
              end="2022-01-01T00:00:00Z"
              weekday={0}
              biweekly={false}
              timeStart="15:00:00"
              timeEnd="17:00:00"
            />
            <RecommendedSlot
              id={1}
              start="2021-01-01T00:00:00Z"
              end="2022-01-01T00:00:00Z"
              weekday={2}
              biweekly
              timeStart="22:00:00"
              timeEnd="24:00:00"
            />
          </table>
        </Recommendations>
        <Terms>
          <H2 as="h3" style={{ marginTop: 0 }}>
            {t("Recommendation.thisPartsTerms")}
          </H2>
          <TermButton
            iconLeft={<IconInformation />}
            onClick={() => console.log("TODO")} // eslint-disable-line no-console
          >
            TODO
          </TermButton>
          <TermButton
            iconLeft={<IconInformation />}
            onClick={() => console.log("TODO")} // eslint-disable-line no-console
          >
            TODO
          </TermButton>
        </Terms>
        <ActionContainer>
          <div>
            <Button
              variant="secondary"
              iconLeft={<IconCrossCircle />}
              onClick={() => console.log("decline")} // eslint-disable-line no-console
            >
              {t("Recommendation.actionDecline")}
            </Button>
            <Button
              variant="secondary"
              iconLeft={<IconArrowRight />}
              onClick={() => console.log("ignore")} // eslint-disable-line no-console
            >
              {t("Recommendation.actionIgnoreSpace")}
            </Button>
          </div>
          <div>
            <Button
              variant="primary"
              iconLeft={<IconCheckCircle />}
              onClick={
                () => console.log("approve") // eslint-disable-line no-console
              }
            >
              {t("Recommendation.actionApprove")}
            </Button>
          </div>
        </ActionContainer>
        <p style={{ lineHeight: "var(--lineheight-xl)" }}>
          {t("Recommendation.actionHelperText")}
        </p>
      </NarrowContainer>
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

export default withMainMenu(Recommendation);
