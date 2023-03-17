import { useLazyQuery, useQuery } from "@apollo/client";
import { breakpoints } from "common/src/common/style";
import { H2 } from "common/src/common/typography";
import {
  PaymentOrderType,
  Query,
  QueryOrderArgs,
  QueryReservationByPkArgs,
  ReservationType,
} from "common/types/gql-types";
import { LoadingSpinner } from "hds-react";
import { get } from "lodash";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Container from "../../../components/common/Container";
import ReservationConfirmation from "../../../components/reservation/ReservationConfirmation";
import ReservationInfoCard from "../../../components/reservation/ReservationInfoCard";
import { Paragraph } from "../../../components/reservation/styles";
import {
  GET_ORDER,
  GET_RESERVATION,
} from "../../../modules/queries/reservation";

type Props = {
  reservationPk: number;
};

export const getServerSideProps: GetServerSideProps = async ({
  locale,
  params,
}) => {
  const reservationPk = Number(params.id);

  return {
    props: {
      reservationPk,
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Heading = styled(H2).attrs({ as: "h1" })``;

const StyledContainer = styled(Container)`
  padding: var(--spacing-m) var(--spacing-m) var(--spacing-layout-m);

  @media (min-width: ${breakpoints.m}) {
    max-width: 1000px;
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

const useOrder = (
  orderUuid: string
): { order: PaymentOrderType | null; error: boolean; loading: boolean } => {
  const [error, setError] = useState<boolean>(false);
  const [order, setOrder] = useState<PaymentOrderType>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [getOrder] = useLazyQuery<Query, QueryOrderArgs>(GET_ORDER, {
    fetchPolicy: "no-cache",
    onCompleted: (data) => {
      if (!data.order) {
        setError(true);
        setLoading(false);
        return;
      }
      setOrder(data.order);
      setLoading(false);
    },
    onError: () => {
      setError(true);
      setLoading(false);
    },
  });

  useEffect(() => {
    if (orderUuid) {
      setLoading(true);
      getOrder({ variables: { orderUuid } });
    }
  }, [getOrder, orderUuid]);

  return { order, error, loading };
};

const ReservationSuccess = ({ reservationPk }: Props) => {
  const { t } = useTranslation();
  const [reservation, setReservation] = useState<ReservationType>(null);
  const [error, setError] = useState<boolean>(false);

  useQuery<Query, QueryReservationByPkArgs>(GET_RESERVATION, {
    fetchPolicy: "no-cache",
    variables: { pk: reservationPk },
    onCompleted: (data) => {
      if (!data.reservationByPk) {
        setError(true);
        return;
      }
      setReservation(data.reservationByPk);
    },
  });

  const {
    order,
    error: orderError,
    loading: orderLoading,
  } = useOrder(reservation?.orderUuid);

  const isOrderUuidMissing = reservation && !reservation.orderUuid;

  if (error || orderError || isOrderUuidMissing) {
    return (
      <StyledContainer>
        <Columns>
          <div>
            <Heading>{t("common:error.error")}</Heading>
            <Paragraph>{t("common:error.dataError")}</Paragraph>
          </div>
        </Columns>
      </StyledContainer>
    );
  }

  if (!reservation || orderLoading) {
    return (
      <StyledContainer>
        <Columns style={{ justifyItems: "center" }}>
          <LoadingSpinner />
        </Columns>
      </StyledContainer>
    );
  }

  const reservationUnit = get(reservation, "reservationUnits.[0]");

  return (
    <StyledContainer>
      <Columns>
        <div>
          <ReservationInfoCard
            reservation={reservation}
            reservationUnit={reservationUnit}
            type="confirmed"
          />
        </div>
        <ReservationConfirmation
          reservation={reservation}
          reservationUnit={reservationUnit}
          order={order}
        />
      </Columns>
    </StyledContainer>
  );
};

export default ReservationSuccess;
