import React from "react";
import { gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { H1, H3, SemiBold, Strong, CenterSpinner, Flex, TitleSection } from "common/styled";
import { breakpoints } from "common/src/const";
import { useApplicationRoundCriteriaQuery } from "@gql/gql-types";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { formatDate } from "@/common/util";
import { errorToast } from "common/src/common/toast";
import { Accordion as AccordionBase } from "@/component/Accordion";
import TimeframeStatus from "../TimeframeStatus";

interface IRouteParams {
  [key: string]: string;
  applicationRoundId: string;
}

const Accordion = styled(AccordionBase)`
  && > div > h2 {
    --header-padding: 0;
  }
`;

const ReservationUnits = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  font-size: var(--fontsize-heading-xs);

  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-l);
  }
`;

const ReservationUnit = styled.div`
  margin-bottom: var(--spacing-3-xl);

  div {
    margin-bottom: var(--spacing-2-xs);
  }
`;

// export so it doesn't get removed (codegen makes a copy of it)
export const APPLICATION_ROUND_QUERY = gql`
  query ApplicationRoundCriteria($id: ID!) {
    applicationRound(id: $id) {
      id
      pk
      nameFi
      reservationUnitCount
      applicationPeriodBeginsAt
      applicationPeriodEndsAt
      reservationPeriodBeginDate
      reservationPeriodEndDate
      reservationUnits {
        id
        pk
        nameFi
        spaces {
          id
          nameFi
        }
        unit {
          id
          nameFi
        }
      }
    }
  }
`;

function Criteria({ applicationRoundPk }: { applicationRoundPk: number }): JSX.Element {
  const { t } = useTranslation();

  const id = base64encode(`ApplicationRoundNode:${applicationRoundPk}`);
  const { data, loading } = useApplicationRoundCriteriaQuery({
    variables: { id },
    skip: !applicationRoundPk,
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
  });
  const { applicationRound } = data ?? {};
  const reservationUnits = filterNonNullable(applicationRound?.reservationUnits);

  if (loading) {
    return <CenterSpinner />;
  }
  if (applicationRound == null) {
    return <div>Error: failed to load application round</div>;
  }

  return (
    <>
      <TitleSection>
        <H1 $noMargin>{applicationRound.nameFi}</H1>
        <Flex $direction="row" $justifyContent="space-between" $wrap="wrap">
          <TimeframeStatus
            applicationPeriodBeginsAt={applicationRound.applicationPeriodBeginsAt}
            applicationPeriodEndsAt={applicationRound.applicationPeriodEndsAt}
          />
          <span>
            <SemiBold>{applicationRound.reservationUnitCount}</SemiBold>{" "}
            <span>{t("ApplicationRound.attachedReservationUnits")}</span>
          </span>
        </Flex>
      </TitleSection>
      <Accordion heading={t("ApplicationRound.searchAndUsageTimeRanges")} initiallyOpen>
        <div>
          <H3>{t("ApplicationRound.applicationPeriodTitle")}</H3>
          <div>
            {t("common.begins")} {formatDate(applicationRound.applicationPeriodBeginsAt)}
          </div>
          <div>
            {t("common.ends")} {formatDate(applicationRound.applicationPeriodEndsAt)}
          </div>
        </div>
        <div>
          <H3>{t("ApplicationRound.reservationPeriodTitle")}</H3>
          <div>
            {t("common.begins")} {formatDate(applicationRound.reservationPeriodBeginDate)}
          </div>
          <div>
            {t("common.ends")} {formatDate(applicationRound.reservationPeriodEndDate)}
          </div>
        </div>
      </Accordion>
      <Accordion heading={t("ApplicationRound.usedReservationUnits")} initiallyOpen>
        <ReservationUnits>
          {/* TODO this should be a reduce where the unique key is the unit pk and under that is all the reservationUnits that belong to it */}
          {reservationUnits?.map((reservationUnit) => (
            <ReservationUnit key={reservationUnit.pk}>
              <div>
                <Strong>{reservationUnit.unit?.nameFi ?? "-"}</Strong>
              </div>
              <div>{reservationUnit.nameFi}</div>
            </ReservationUnit>
          ))}
        </ReservationUnits>
      </Accordion>
    </>
  );
}

function CriteriaRouted(): JSX.Element {
  const { applicationRoundId } = useParams<IRouteParams>();
  const { t } = useTranslation();

  const applicationRoundPk = Number(applicationRoundId);
  if (!applicationRoundId || Number.isNaN(applicationRoundPk)) {
    return <div>{t("errors.router.invalidApplicationRoundNumber")}</div>;
  }
  return <Criteria applicationRoundPk={applicationRoundPk} />;
}

export default CriteriaRouted;
