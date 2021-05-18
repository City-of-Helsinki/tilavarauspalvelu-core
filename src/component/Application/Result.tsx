import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { IconLocation, Notification } from "hds-react";
import {
  getAllocationResult,
  getApplication,
  getApplicationRound,
} from "../../common/api";
import Loader from "../Loader";
import {
  AllocationResult,
  Application as ApplicationType,
  ApplicationRound as ApplicationRoundType,
} from "../../common/types";
import { ContentContainer, NarrowContainer } from "../../styles/layout";
import { ContentHeading, H2, H3 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import LinkPrev from "../LinkPrev";
import { Divider, Strong } from "../../styles/util";

interface IRouteParams {
  applicationId: string;
  applicationEventScheduleId: string;
}

const Wrapper = styled.div`
  width: 100%;
  padding-bottom: var(--spacing-5-xl);
`;

const Heading = styled(ContentHeading)`
  margin: var(--spacing-m) 0;
  word-break: break-all;
`;

const Location = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--spacing-m);
  font-size: var(--fontsize-heading-s);
  margin-bottom: var(--spacing-xl);

  svg {
    position: relative;
    top: var(--spacing-3-xs);
  }
`;

const Subheading = styled(H3)`
  margin-bottom: var(--spacing-l);
`;

const Reservations = styled.table`
  border-spacing: 0;

  th {
    font-family: var(--tilavaraus-admin-font-bold);
    font-weight: 700;
    padding-bottom: var(--spacing-xs);
  }

  th,
  td {
    padding-right: var(--spacing-l);
  }

  td {
    padding-bottom: var(--spacing-2-xs);
  }
`;

function Result(): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationType | null>(null);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [
    allocationResult,
    setAllocationResult,
  ] = useState<AllocationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    applicationId,
    applicationEventScheduleId,
  } = useParams<IRouteParams>();
  const { t } = useTranslation();

  const fetchApplication = async (id: number) => {
    try {
      const result = await getApplication(id);

      setApplication(result);
    } catch (error) {
      setErrorMsg("errors.errorFetchingApplication");
      setIsLoading(false);
    }
  };

  const fetchApplicationRound = async (app: ApplicationType) => {
    try {
      const applicationRoundResult = await getApplicationRound({
        id: app.applicationRoundId,
      });
      setApplicationRound(applicationRoundResult);
    } catch (error) {
      setErrorMsg("errors.errorFetchingApplicationRound");
      setIsLoading(false);
    }
  };

  const fetchAllocationResult = async (applicationEventId: number) => {
    try {
      const result = await getAllocationResult({
        id: applicationEventId,
      });
      setAllocationResult(result);
    } catch (error) {
      setErrorMsg("errors.errorFetchingRecommendations");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication(Number(applicationId));
  }, [applicationId]);

  useEffect(() => {
    if (application?.applicationRoundId) {
      fetchApplicationRound(application);
    }
  }, [application]);

  useEffect(() => {
    if (applicationEventScheduleId) {
      fetchAllocationResult(Number(applicationEventScheduleId));
    }
  }, [applicationEventScheduleId]);

  useEffect(() => {
    if (application && applicationRound && allocationResult) {
      setIsLoading(false);
    }
  }, [application, applicationRound, allocationResult]);

  if (isLoading) {
    return <Loader />;
  }

  const customerName =
    application?.applicantType === "individual"
      ? application?.applicantName
      : application?.organisation?.name;

  return (
    <Wrapper>
      {application && applicationRound && allocationResult && (
        <>
          <ContentContainer style={{ marginBottom: "var(--spacing-xl)" }}>
            <LinkPrev route={`/application/${applicationId}`} />
          </ContentContainer>
          <NarrowContainer>
            <p>{customerName}</p>
            <Heading>{allocationResult.applicationEvent.name}</Heading>
            <p>
              <Strong>{t("Application.allocatedReservations")}</Strong>
            </p>
            <div>{applicationRound.name}</div>
            <Divider />
            <Location>
              <IconLocation />
              <H2>{allocationResult.unitName}</H2>
              <span>{allocationResult.allocatedReservationUnitName}</span>
            </Location>
            <Subheading>
              {t("Application.allocatedForGroupX", {
                group: allocationResult.applicationEvent.name,
              })}
            </Subheading>
            <Reservations>
              <tbody>
                <tr>
                  <th>{t("common.weekday")}</th>
                  <th>{t("common.date")}</th>
                  <th>{t("common.time")}</th>
                </tr>
                <tr>
                  <td>TODO</td>
                  <td>
                    <Strong>TODO</Strong>
                  </td>
                  <td>TODO</td>
                </tr>
                <tr>
                  <td>TODO</td>
                  <td>
                    <Strong>TODO</Strong>
                  </td>
                  <td>TODO</td>
                </tr>
              </tbody>
            </Reservations>
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
        </>
      )}
    </Wrapper>
  );
}

export default withMainMenu(Result);
