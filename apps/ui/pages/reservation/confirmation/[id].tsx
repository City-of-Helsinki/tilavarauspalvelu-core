import React from "react";
import { useQuery } from "@apollo/client";
import { breakpoints } from "common/src/common/style";
import { H2 } from "common/src/common/typography";
import { Query, QueryReservationByPkArgs } from "common/types/gql-types";
import { LoadingSpinner } from "hds-react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { Container } from "common";
import ReservationConfirmation from "../../../components/reservation/ReservationConfirmation";
import ReservationInfoCard from "../../../components/reservation/ReservationInfoCard";
import { Paragraph } from "../../../components/reservation/styles";
import { GET_RESERVATION } from "../../../modules/queries/reservation";
import { useOrder } from "../../../hooks/reservation";

type Props = {
  reservationPk: number;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { locale, params } = ctx;
  const reservationPk = Number(params?.id);

  return {
    props: {
      key: `${reservationPk}${locale}`,
      reservationPk: Number.isNaN(reservationPk) ? null : reservationPk,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

const Heading = styled(H2).attrs({ as: "h1" })``;

const StyledContainer = styled(Container)`
  @media (min-width: ${breakpoints.m}) {
    margin-bottom: var(--spacing-layout-l);
  }
`;

const Columns = styled.div`
  grid-template-columns: 1fr;
  display: grid;
  align-items: flex-start;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    & > div:nth-of-type(1) {
      order: 2;
    }

    margin-top: var(--spacing-xl);
    grid-template-columns: 1fr 378px;
  }
`;

const ReservationSuccess = ({ reservationPk }: Props) => {
  const { t } = useTranslation();

  const {
    data,
    loading: isReservationLoading,
    error: isError,
  } = useQuery<Query, QueryReservationByPkArgs>(GET_RESERVATION, {
    skip: !reservationPk,
    fetchPolicy: "no-cache",
    variables: { pk: reservationPk },
  });
  const reservation = data?.reservationByPk;

  const {
    order,
    isError: orderError,
    isLoading: orderLoading,
  } = useOrder({ orderUuid: reservation?.orderUuid ?? "" });

  const isOrderUuidMissing = reservation && !reservation.orderUuid;

  // TODO display error if the orderUuid is missing or the pk is invalid
  if (isError || orderError || isOrderUuidMissing) {
    return (
      <StyledContainer size="s">
        <Columns>
          <div>
            <Heading>{t("common:error.error")}</Heading>
            <Paragraph>{t("common:error.dataError")}</Paragraph>
          </div>
        </Columns>
      </StyledContainer>
    );
  }

  if (isReservationLoading || orderLoading || !reservation) {
    return (
      <StyledContainer size="s">
        <Columns style={{ justifyItems: "center" }}>
          <LoadingSpinner />
        </Columns>
      </StyledContainer>
    );
  }

  const reservationUnit = reservation?.reservationUnits?.[0] ?? undefined;

  return (
    <StyledContainer size="s">
      <Columns>
        <div>
          <ReservationInfoCard
            reservation={reservation}
            reservationUnit={reservationUnit}
            type="confirmed"
          />
        </div>
        {reservationUnit ? (
          <ReservationConfirmation
            reservation={reservation}
            reservationUnit={reservationUnit}
            order={order}
          />
        ) : null}
      </Columns>
    </StyledContainer>
  );
};

export default ReservationSuccess;
