import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Container from "../../components/common/Container";
import { ReservationUnit as ReservationUnitType } from "../../modules/types";
import { getReservationUnit, getReservationUnits } from "../../modules/api";
import Head from "../../components/reservation-unit/Head";
import Address from "../../components/reservation-unit/Address";
import Images from "../../components/reservation-unit/Images";
import { SpanTwoColumns } from "../../components/common/common";
import Sanitize from "../../components/common/Sanitize";
import { breakpoint } from "../../modules/style";
import RelatedUnits from "../../components/reservation-unit/RelatedUnits";
import useReservationUnitsList from "../../hooks/useReservationUnitList";
import StartApplicationBar from "../../components/common/StartApplicationBar";
import { AccordionWithState as Accordion } from "../../components/common/Accordion";

type Props = {
  reservationUnit: ReservationUnitType | null;
  relatedReservationUnits: ReservationUnitType[];
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getServerSideProps = async ({ locale, params }) => {
  const id = Number(params.id);

  let reservationUnit = null;
  let relatedReservationUnits = [] as ReservationUnitType[];

  if (id) {
    reservationUnit = await getReservationUnit(Number(id));
    if (reservationUnit.id) {
      relatedReservationUnits = (
        await getReservationUnits({ unit: reservationUnit.unitId })
      ).filter((u) => u.id !== Number(id));
    }

    return {
      props: {
        ...(await serverSideTranslations(locale)),
        reservationUnit,
        relatedReservationUnits,
      },
    };
  }

  return { props: { ...(await serverSideTranslations(locale)), paramsId: id } };
};

const TwoColumnLayout = styled.div`
  display: grid;
  gap: var(--spacing-layout-s);
  grid-template-columns: 7fr 390px;

  @media (max-width: ${breakpoint.l}) {
    grid-template-columns: 1fr;
  }
`;

const Content = styled.div`
  font-family: var(--font-regular);
`;

const ReservationUnit = ({
  reservationUnit,
  relatedReservationUnits,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const reservationUnitList = useReservationUnitsList();

  return reservationUnit ? (
    <>
      <Head
        reservationUnit={reservationUnit}
        reservationUnitList={reservationUnitList}
      />
      <Container>
        <TwoColumnLayout>
          <div>
            <Accordion open heading={t("reservationUnit:description")}>
              <Content>
                <Sanitize html={reservationUnit.description} />
              </Content>
            </Accordion>
            <Accordion heading={t("reservationUnit:termsOfUse")}>
              <Content>
                <Sanitize html={reservationUnit.termsOfUse} />
              </Content>
            </Accordion>
          </div>
          <div>
            <Address reservationUnit={reservationUnit} />
            <Images images={reservationUnit.images} />
          </div>
          <SpanTwoColumns>
            <RelatedUnits
              reservationUnitList={reservationUnitList}
              units={relatedReservationUnits}
            />
          </SpanTwoColumns>
        </TwoColumnLayout>
      </Container>
      <StartApplicationBar
        count={reservationUnitList.reservationUnits.length}
      />
    </>
  ) : null;
};

export default ReservationUnit;
