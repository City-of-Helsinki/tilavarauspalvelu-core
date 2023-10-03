import React from "react";
import { gql, useQuery as useApolloQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { H1, H2, H3, Strong } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { type Query } from "common/types/gql-types";
import { ContentContainer, IngressContainer } from "@/styles/layout";
import { formatDate } from "@/common/util";
import { publicUrl } from "@/common/const";
import { useNotification } from "@/context/NotificationContext";
import Loader from "@/component/Loader";
import Accordion from "@/component/Accordion";
import BreadcrumbWrapper from "@/component/BreadcrumbWrapper";
import TimeframeStatus from "./TimeframeStatus";

interface IRouteParams {
  [key: string]: string;
  applicationRoundId: string;
}

const Details = styled.div`
  max-width: ${breakpoints.l};

  > div {
    &.block {
      @media (min-width: ${breakpoints.l}) {
        display: block;
      }
    }

    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    margin-bottom: var(--spacing-m);

    ${Strong} {
      font-size: var(--fontsize-heading-xs);
    }
  }

  @media (min-width: ${breakpoints.l}) {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-m);
  }
`;

const ReservationUnitCount = styled(H2).attrs({
  as: "div",
  $legacy: true,
})`
  margin-bottom: var(--spacing-3-xs);
`;

const StyledAccordion = styled(Accordion).attrs({
  style: {
    "--header-font-size": "var(--fontsize-heading-m)",
  } as React.CSSProperties,
})`
  h2.heading {
    padding: 0 var(--spacing-m);
  }
`;

const AccordionContent = styled.div`
  @media (min-width: ${breakpoints.m}) {
    padding-left: var(--spacing-layout-xl);
  }
`;

const TitleBox = styled.div`
  ${H3} {
    margin-bottom: var(--spacing-2-xs);
  }

  div {
    margin-bottom: var(--spacing-2-xs);
  }

  margin-bottom: var(--spacing-layout-l);
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

const APPLICATION_ROUND_QUERY = gql`
  query ApplicationRoundCriteria($pk: [ID]!) {
    applicationRounds(pk: $pk) {
      edges {
        node {
          pk
          nameFi
          reservationUnitCount
          applicationPeriodBegin
          applicationPeriodEnd
          reservationPeriodBegin
          reservationPeriodEnd
        }
      }
    }
  }
`;

// TODO combine with APPLICATION_RESERVATION_UNITS_QUERY
const RESERVATION_UNIT_QUERY = gql`
  query ReservationUnit($applicationRound: [ID]!) {
    reservationUnits(applicationRound: $applicationRound) {
      edges {
        node {
          pk
          nameFi
          spaces {
            nameFi
          }
          unit {
            nameFi
          }
        }
      }
    }
  }
`;

function Criteria({
  applicationRoundId,
}: {
  applicationRoundId: number;
}): JSX.Element {
  const { t } = useTranslation();
  const { notifyError } = useNotification();

  const { data: applicationRoundData, loading: isLoadingApplicationRound } =
    useApolloQuery<Query>(APPLICATION_ROUND_QUERY, {
      variables: { pk: [applicationRoundId] },
      onError: () => {
        notifyError(t("errors.errorFetchingData"));
      },
    });
  const applicationRounds =
    applicationRoundData?.applicationRounds?.edges
      ?.map((edge) => edge?.node)
      .filter((n): n is NonNullable<typeof n> => n !== null) ?? [];
  const applicationRound = applicationRounds[0];

  const { data: resUnitData, loading: isLoadingReservationUnits } =
    useApolloQuery<Query>(RESERVATION_UNIT_QUERY, {
      variables: { applicationRound: [applicationRoundId] },
      onError: () => {
        notifyError(t("errors.errorFetchingData"));
      },
    });
  const reservationUnits =
    resUnitData?.reservationUnits?.edges
      ?.map((edge) => edge?.node)
      .filter((n): n is NonNullable<typeof n> => n !== null) ?? [];

  const isLoading = isLoadingApplicationRound || isLoadingReservationUnits;
  if (isLoading) {
    return <Loader />;
  }
  if (applicationRound == null) {
    return <div>Error: failed to load application round</div>;
  }

  const title = applicationRound.nameFi ?? "-";
  return (
    <>
      <BreadcrumbWrapper
        route={[
          "recurring-reservations",
          `${publicUrl}/recurring-reservations/application-rounds`,
          `${publicUrl}/recurring-reservations/application-rounds/${applicationRound.pk}`,
          "criteria",
        ]}
        aliases={[
          { slug: "application-round", title },
          { slug: `${applicationRound.pk}`, title },
        ]}
      />
      <IngressContainer>
        <H1 $legacy>{applicationRound.nameFi}</H1>
        <Details>
          <div>
            <TimeframeStatus
              applicationPeriodBegin={applicationRound.applicationPeriodBegin}
              applicationPeriodEnd={applicationRound.applicationPeriodEnd}
            />
          </div>
          <div>
            <ReservationUnitCount>
              {applicationRound.reservationUnitCount}
            </ReservationUnitCount>
            <div>{t("ApplicationRound.attachedReservationUnits")}</div>
          </div>
        </Details>
      </IngressContainer>
      <ContentContainer>
        <StyledAccordion
          heading={t("ApplicationRound.searchAndUsageTimeRanges")}
          defaultOpen
        >
          <AccordionContent>
            <TitleBox>
              <H3>{t("ApplicationRound.applicationPeriodTitle")}</H3>
              <div>
                {t("common.begins")}{" "}
                {formatDate(applicationRound.applicationPeriodBegin)}
              </div>
              <div>
                {t("common.ends")}{" "}
                {formatDate(applicationRound.applicationPeriodEnd)}
              </div>
            </TitleBox>
            <TitleBox>
              <H3>{t("ApplicationRound.reservationPeriodTitle")}</H3>
              <div>
                {t("common.begins")}{" "}
                {formatDate(applicationRound.reservationPeriodBegin)}
              </div>
              <div>
                {t("common.ends")}{" "}
                {formatDate(applicationRound.reservationPeriodEnd)}
              </div>
            </TitleBox>
          </AccordionContent>
        </StyledAccordion>
        <StyledAccordion
          heading={t("ApplicationRound.usedReservationUnits")}
          defaultOpen
        >
          <AccordionContent>
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
          </AccordionContent>
        </StyledAccordion>
      </ContentContainer>
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
  return <Criteria applicationRoundId={applicationRoundPk} />;
}

export default CriteriaRouted;
