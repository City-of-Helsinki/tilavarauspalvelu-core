import React from "react";
import { gql } from "@apollo/client";
import { TimeframeStatus } from "@lib/application-rounds";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import { errorToast } from "ui/src/components/toast";
import { breakpoints } from "ui/src/modules/const";
import { formatDate, parseValidDateObject } from "ui/src/modules/date-utils";
import { createNodeId, filterNonNullable, ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import { H1, H3, SemiBold, Strong, CenterSpinner, Flex, TitleSection } from "ui/src/styled";
import { Accordion as AccordionBase } from "@/components/Accordion";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { NOT_FOUND_SSR_VALUE } from "@/modules/const";
import { useApplicationRoundCriteriaQuery, UserPermissionChoice } from "@gql/gql-types";

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

function Criteria({ applicationRoundPk }: { applicationRoundPk: number }): JSX.Element {
  const { t } = useTranslation();

  const { data, loading } = useApplicationRoundCriteriaQuery({
    variables: { id: createNodeId("ApplicationRoundNode", applicationRoundPk) },
    skip: !applicationRoundPk,
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
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
            <span>{t("applicationRound:attachedReservationUnits")}</span>
          </span>
        </Flex>
      </TitleSection>
      <Accordion heading={t("applicationRound:searchAndUsageTimeRanges")} initiallyOpen>
        <div>
          <H3>{t("applicationRound:applicationPeriodTitle")}</H3>
          <div>
            {t("common:begins")} {formatDate(parseValidDateObject(applicationRound.applicationPeriodBeginsAt))}
          </div>
          <div>
            {t("common:ends")} {formatDate(parseValidDateObject(applicationRound.applicationPeriodEndsAt))}
          </div>
        </div>
        <div>
          <H3>{t("applicationRound:reservationPeriodTitle")}</H3>
          <div>
            {t("common:begins")} {formatDate(parseValidDateObject(applicationRound.reservationPeriodBeginDate))}
          </div>
          <div>
            {t("common:ends")} {formatDate(parseValidDateObject(applicationRound.reservationPeriodEndDate))}
          </div>
        </div>
      </Accordion>
      <Accordion heading={t("applicationRound:usedReservationUnits")} initiallyOpen>
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

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
export default function ApplicationRoundRouted(props: PropsNarrowed): JSX.Element {
  return (
    <AuthorizationChecker permission={UserPermissionChoice.CanManageApplications}>
      <Criteria applicationRoundPk={props.pk} />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale, query }: GetServerSidePropsContext) {
  const pk = toNumber(ignoreMaybeArray(query.id));

  if (pk == null || pk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }

  return {
    props: {
      pk,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

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
