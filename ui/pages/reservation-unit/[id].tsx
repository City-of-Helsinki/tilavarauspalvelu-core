import React, { useMemo } from "react";
import { GetServerSideProps } from "next";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Koros } from "hds-react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Container from "../../components/common/Container";
import Head from "../../components/reservation-unit/Head";
import Address from "../../components/reservation-unit/Address";
import Sanitize from "../../components/common/Sanitize";
import { breakpoint } from "../../modules/style";
import RelatedUnits from "../../components/reservation-unit/RelatedUnits";
import useReservationUnitsList from "../../hooks/useReservationUnitList";
import StartApplicationBar from "../../components/common/StartApplicationBar";
import { AccordionWithState as Accordion } from "../../components/common/Accordion";
import apolloClient from "../../modules/apolloClient";
import Map from "../../components/Map";
import { H2 } from "../../modules/style/typography";
import { getActiveOpeningTimes } from "../../modules/openingHours";
import {
  Query,
  QueryReservationUnitByPkArgs,
  QueryReservationUnitsArgs,
  QueryTermsOfUseArgs,
  ReservationUnitByPkType,
  ReservationUnitType,
  ReservationUnitTypeEdge,
  TermsOfUseType,
} from "../../modules/gql-types";
import { getTranslation } from "../../modules/util";
import {
  RELATED_RESERVATION_UNITS,
  RESERVATION_UNIT,
  TERMS_OF_USE,
} from "../../modules/queries/reservationUnit";
import {
  getEquipmentList,
  isReservationUnitPublished,
} from "../../modules/reservationUnit";

type Props = {
  reservationUnit: ReservationUnitByPkType | null;
  relatedReservationUnits: ReservationUnitType[];
  termsOfUse: Record<string, TermsOfUseType>;
};

export const getServerSideProps: GetServerSideProps = async ({
  locale,
  params,
  query,
}) => {
  const id = Number(params.id);
  const uuid = query.ru;
  let relatedReservationUnits = [] as ReservationUnitType[];

  if (id) {
    const { data: reservationUnitData } = await apolloClient.query<
      Query,
      QueryReservationUnitByPkArgs
    >({
      query: RESERVATION_UNIT,
      variables: {
        pk: id,
      },
    });

    const previewPass = uuid === reservationUnitData.reservationUnitByPk.uuid;

    if (
      !isReservationUnitPublished(reservationUnitData.reservationUnitByPk) &&
      !previewPass
    ) {
      return {
        notFound: true,
      };
    }

    const isDraft = reservationUnitData.reservationUnitByPk?.isDraft;
    if (isDraft && !previewPass) {
      return {
        notFound: true,
      };
    }

    const { data: genericTermsData } = await apolloClient.query<
      Query,
      QueryTermsOfUseArgs
    >({
      query: TERMS_OF_USE,
      variables: {
        termsType: "generic_terms",
      },
    });
    const genericTerms = genericTermsData.termsOfUse?.edges[0]?.node || {};

    if (reservationUnitData.reservationUnitByPk?.unit?.pk) {
      const { data: relatedReservationUnitsData } = await apolloClient.query<
        Query,
        QueryReservationUnitsArgs
      >({
        query: RELATED_RESERVATION_UNITS,
        variables: {
          unit: [String(reservationUnitData.reservationUnitByPk.unit.pk)],
        },
      });

      relatedReservationUnits =
        relatedReservationUnitsData?.reservationUnits?.edges
          .map((n: ReservationUnitTypeEdge) => n.node)
          .filter(
            (n: ReservationUnitType) =>
              n.pk !== reservationUnitData.reservationUnitByPk.pk
          );
    }

    if (!reservationUnitData.reservationUnitByPk?.pk) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        ...(await serverSideTranslations(locale)),
        overrideBackgroundColor: "var(--tilavaraus-gray)",
        reservationUnit: reservationUnitData.reservationUnitByPk,
        relatedReservationUnits,
        termsOfUse: { genericTerms },
      },
    };
  }

  return { props: { ...(await serverSideTranslations(locale)), paramsId: id } };
};

const Wrapper = styled.div`
  padding-bottom: var(--spacing-layout-xl);
`;

const TwoColumnLayout = styled.div`
  display: grid;
  gap: var(--spacing-layout-s);
  grid-template-columns: 7fr 390px;
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-xl);

  @media (max-width: ${breakpoint.l}) {
    grid-template-columns: 1fr;
    margin-bottom: var(--spacing-m);
  }
`;

const Content = styled.div`
  & p {
    font-size: var(--fontsize-body-l);
    line-height: var(--lineheight-xl);
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

const BottomWrapper = styled.div`
  margin: 0;
  padding: 0;
  background-color: var(--color-silver-medium-light);
`;

const BottomContainer = styled(Container)`
  background-color: var(--color-silver-medium-light);
  margin-top: var(--spacing-layout-l);
  margin-bottom: calc(var(--spacing-s) * -1 + var(--spacing-layout-xl) * -1);
  padding-bottom: var(--spacing-layout-xl);
`;

const StyledKoros = styled(Koros).attrs({
  type: "basic",
})`
  fill: var(--tilavaraus-gray);
`;

const StyledH2 = styled(H2)``;

const EquipmentList = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-2-xs) var(--spacing-m);
  padding: 0;

  @media (min-width: ${breakpoint.s}) {
    grid-template-columns: 1fr 1fr;
    row-gap: var(--spacing-s);
  }

  @media (min-width: ${breakpoint.m}) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const EquipmentItem = styled.li`
  font-size: var(--fontsize-body-m);

  @media (min-width: ${breakpoint.s}) {
    font-size: var(--fontsize-body-l);
  }
`;

const MapWrapper = styled.div`
  margin-bottom: var(--spacing-xl);
`;

const ReservationUnit = ({
  reservationUnit,
  relatedReservationUnits,
  termsOfUse,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const activeOpeningTimes = getActiveOpeningTimes(
    reservationUnit.openingHours?.openingTimePeriods
  );

  const reservationUnitList = useReservationUnitsList();

  const shouldDisplayBottomWrapper = relatedReservationUnits?.length > 0;

  const equipmentList = useMemo(() => {
    return getEquipmentList(reservationUnit.equipment);
  }, [reservationUnit.equipment]);

  return reservationUnit ? (
    <Wrapper>
      <Head
        reservationUnit={reservationUnit}
        activeOpeningTimes={activeOpeningTimes}
        reservationUnitList={reservationUnitList}
        viewType="recurring"
      />
      <Container>
        <TwoColumnLayout>
          <div>
            <Accordion
              open
              heading={t("reservationUnit:description")}
              theme="thin"
              data-testid="reservation-unit__accordion--description"
            >
              <Content>
                <p>
                  <Sanitize
                    html={getTranslation(reservationUnit, "description")}
                  />
                </p>
              </Content>
            </Accordion>
            {equipmentList?.length > 0 && (
              <Accordion
                open
                heading={t("reservationUnit:equipment")}
                theme="thin"
                data-testid="reservation-unit__accordion--equipment"
              >
                <Content>
                  <EquipmentList>
                    {equipmentList.map((equipment) => (
                      <EquipmentItem key={equipment}>{equipment}</EquipmentItem>
                    ))}
                  </EquipmentList>
                </Content>
              </Accordion>
            )}
          </div>
          <div>
            <Address reservationUnit={reservationUnit} />
          </div>
        </TwoColumnLayout>
        {reservationUnit.unit?.location && (
          <MapWrapper>
            <StyledH2>{t("common:location")}</StyledH2>
            <Map
              title={getTranslation(reservationUnit.unit, "name")}
              latitude={Number(reservationUnit.unit.location.latitude)}
              longitude={Number(reservationUnit.unit.location.longitude)}
            />
          </MapWrapper>
        )}
        <TwoColumnLayout>
          <Address reservationUnit={reservationUnit} />
          <div />
          <Accordion heading={t("reservationUnit:termsOfUse")} theme="thin">
            <Content>
              <p>
                <Sanitize
                  html={getTranslation(termsOfUse?.genericTerms, "text")}
                />
              </p>
            </Content>
          </Accordion>
          <div />
          {getTranslation(reservationUnit, "termsOfUse") &&
            reservationUnit.serviceSpecificTerms && (
              <>
                <Accordion
                  heading={t("reservationUnit:termsOfUseSpaces")}
                  theme="thin"
                >
                  <Content>
                    <p>
                      <Sanitize
                        html={getTranslation(reservationUnit, "termsOfUse")}
                      />
                    </p>
                    <p>
                      <Sanitize
                        html={getTranslation(
                          reservationUnit.serviceSpecificTerms,
                          "text"
                        )}
                      />
                    </p>
                  </Content>
                </Accordion>
                <div />
              </>
            )}
        </TwoColumnLayout>
      </Container>
      <BottomWrapper>
        {shouldDisplayBottomWrapper && (
          <>
            <StyledKoros flipHorizontal />
            <BottomContainer>
              <RelatedUnits
                reservationUnitList={reservationUnitList}
                units={relatedReservationUnits}
                viewType="recurring"
              />
            </BottomContainer>
          </>
        )}
      </BottomWrapper>
      <StartApplicationBar
        count={reservationUnitList.reservationUnits.length}
        clearSelections={reservationUnitList.clearSelections}
      />
    </Wrapper>
  ) : null;
};

export default ReservationUnit;
